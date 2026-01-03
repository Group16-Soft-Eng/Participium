import { PublicMessageRepository } from "@repositories/PublicMessageRepository";
import { PublicMessage } from "@models/dto/PublicMessage";
import { PublicMessageDAO } from "@models/dao/PublicMessageDAO";
import { UserRepository } from "@repositories/UserRepository";
import { OfficerRepository } from "@repositories/OfficerRepository";
import { getIO } from "@services/ioService";

function mapPublicMessageDAOToDTO(dao: PublicMessageDAO): PublicMessage {
  const senderName = dao.sender 
    ? `${dao.sender.firstName || ''} ${dao.sender.lastName || ''}`.trim() || dao.sender.username || dao.sender.email || "Unknown"
    : "Unknown";
  
  return {
    id: dao.id,
    reportId: dao.reportId,
    message: dao.message,
    senderType: dao.senderType,
    senderId: dao.senderId,
    senderName,
    createdAt: dao.createdAt,
    read: dao.read
  };
}

export async function listConversation(reportId: number): Promise<PublicMessage[]> {
  const repo = new PublicMessageRepository();
  const messages = await repo.listByReport(reportId);
  return messages.map(mapPublicMessageDAOToDTO);
}

export async function sendPublicMessage(
  reportId: number,
  senderType: 'citizen' | 'officer',
  senderId: number,
  message: string
): Promise<PublicMessage> {
  const repo = new PublicMessageRepository();
  
  const saved = await repo.save({
    reportId,
    message,
    senderType,
    senderId,
    read: false
  });

  // Fetch the saved message with relations
  const messages = await repo.listByReport(reportId);
  const fullMessage = messages.find(m => m.id === saved.id);
  
  if (!fullMessage) {
    throw new Error("Failed to retrieve saved message");
  }

  const dto = mapPublicMessageDAOToDTO(fullMessage);

  // Emit socket event
  const io = getIO();
  if (io) {
    console.log(`Emitting public-message:new to report:${reportId}`, dto);
    io.to(`report:${reportId}`).emit("public-message:new", {
      id: dto.id,
      reportId: dto.reportId,
      message: dto.message,
      senderType: dto.senderType,
      senderId: dto.senderId,
      senderName: dto.senderName,
      createdAt: dto.createdAt
    });
  } else {
    console.error("Socket.io instance not available");
  }

  return dto;
}
