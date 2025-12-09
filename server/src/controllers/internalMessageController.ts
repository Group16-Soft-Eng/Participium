//! INTERNAL MESSAGE CONTROLLER

import { InternalMessageRepository } from "@repositories/InternalMessageRepository";
import { ReportRepository } from "@repositories/ReportRepository";
import { BadRequestError, ForbiddenError } from "@utils/utils";
import { OfficerRole } from "@models/enums/OfficerRole";

type Participant = {
    type: OfficerRole.TECHNICAL_OFFICE_STAFF | OfficerRole.MAINTAINER;
    id: number
};

export async function listConversation(reportId: number) {
  const repo = new InternalMessageRepository();
  const list = await repo.listByReport(reportId);
  return list.map(m => ({
    id: m.id,
    reportId: m.reportId,
    senderType: m.senderType,
    senderId: m.senderId,
    receiverType: m.receiverType,
    receiverId: m.receiverId,
    message: m.message,
    createdAt: m.createdAt
  }));
}

function ensureAuthorized(report: any, sender: Participant, receiver: Participant) {
  const assignedOfficerId = report.assignedOfficerId;
  const assignedMaintainerId = report.assignedMaintainerId;

  if (sender.type === OfficerRole.TECHNICAL_OFFICE_STAFF) {
    if (assignedOfficerId !== sender.id) throw new ForbiddenError("Not assigned to this report");
    if (receiver.type !== OfficerRole.MAINTAINER || assignedMaintainerId !== receiver.id) {
      throw new ForbiddenError("Invalid receiver for this report");
    }
  } else {
    if (assignedMaintainerId !== sender.id) throw new ForbiddenError("Not assigned to this report");
    if (receiver.type !== OfficerRole.TECHNICAL_OFFICE_STAFF || assignedOfficerId !== receiver.id) {
      throw new ForbiddenError("Invalid receiver for this report");
    }
  }
}

export async function sendInternalMessage(reportId: number, sender: Participant, receiver: Participant, message: string) {
  if (!message?.trim()) throw new BadRequestError("Message cannot be empty");
  const reportRepo = new ReportRepository();
  const report = await reportRepo.getReportById(reportId);
  
  ensureAuthorized(report, sender, receiver);

  const msgRepo = new InternalMessageRepository();
  const saved = await msgRepo.create({
    reportId,
    senderType: sender.type,
    senderId: sender.id,
    receiverType: receiver.type,
    receiverId: receiver.id,
    message,
  });

  return {
    id: saved.id,
    reportId: saved.reportId,
    senderType: saved.senderType,
    senderId: saved.senderId,
    receiverType: saved.receiverType,
    receiverId: saved.receiverId,
    message: saved.message,
    createdAt: saved.createdAt
  };
}