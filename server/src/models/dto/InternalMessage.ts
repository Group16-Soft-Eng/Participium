import { OfficeRole } from "@models/enums/OfficeRole";

export interface InternalMessage {
  id: number;
  reportId: number;
  senderType: OfficeRole.TECHNICAL_OFFICE_STAFF | OfficeRole.MAINTAINER;
  senderId: number;
  receiverType: OfficeRole.TECHNICAL_OFFICE_STAFF | OfficeRole.MAINTAINER;
  receiverId: number;
  message: string;
  createdAt: string;
}