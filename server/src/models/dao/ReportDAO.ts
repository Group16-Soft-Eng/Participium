import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { UserDAO } from "./UserDAO";
import { OfficeType } from "@models/enums/OfficeType";
import { ReportState } from "@models/enums/ReportState";

@Entity("reports")
export class ReportDAO {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: false })
  title!: string;

  @Column({ 
    type: "text",
    transformer: {
      to: (value) => JSON.stringify(value),
      from: (value) => JSON.parse(value)
    }
  })
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

  @Column({ type: "boolean", default: false })
  anonymity!: boolean;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  date!: Date;

  @Column({ type: "text", nullable: false })
  category!: OfficeType;

  @Column({ 
    type: "text",
    transformer: {
      to: (value) => JSON.stringify(value),
      from: (value) => JSON.parse(value)
    }
  })
  document!: {
    Description?: string;
    Photos?: string[];
  };

  @Column({ type: "text", default: ReportState.PENDING })
  state!: ReportState;

  @Column({ type: "text", nullable: true })
  reason!: string | null;
}