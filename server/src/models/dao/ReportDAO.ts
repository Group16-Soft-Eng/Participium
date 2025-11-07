import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { UserDAO } from "./UserDAO";
import { OfficeType } from "@models/enums/OfficeType";
import { ReportState } from "@models/enums/ReportState";

@Entity("reports")
export class ReportDAO {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  title!: string;

  @Column("simple-json")
  location!: {
    id?: number;
    name?: string;
    Coordinates?: {
      longitude: number;
      latitude: number;
    };
  };

  @ManyToOne(() => UserDAO, { nullable: true })
  @JoinColumn({ name: "author_id" })
  author!: UserDAO | null;

  @Column({ default: false })
  anonymity!: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date!: Date;

  @Column({ type: "varchar", nullable: false })
  category!: OfficeType;

  @Column("simple-json")
  document!: {
    Description?: string;
    Photos?: string[];
  };

  @Column({ type: "varchar", default: ReportState.PENDING })
  state!: ReportState;

  @Column({ nullable: true })
  reason!: string | null; // Solo per DECLINED
}