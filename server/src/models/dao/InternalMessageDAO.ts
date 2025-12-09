// ...existing code...
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { ReportDAO } from "@models/dao/ReportDAO";
import { OfficeRole } from "@models/enums/OfficeRole";

export type ParticipantType = OfficeRole.TECHNICAL_OFFICE_STAFF | OfficeRole.MAINTAINER;

@Entity({ name: "internal_messages" })
export class InternalMessageDAO {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ReportDAO, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: ReportDAO;

  @Column({ name: "report_id" })
  @Index()
  reportId!: number;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "text" })
  senderType!: ParticipantType;

  @Column({ type: "int" })
  senderId!: number;

  @Column({ type: "text" })
  receiverType!: ParticipantType;

  @Column({ type: "int" })
  receiverId!: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}