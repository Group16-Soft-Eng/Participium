import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, CreateDateColumn } from "typeorm";
import { UserDAO } from "./UserDAO";
import { ReportDAO } from "./ReportDAO";

@Entity("follows")
@Unique(["user", "report"]) // user_id + report_id = UNIQUE
export class FollowDAO {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserDAO, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserDAO;

  @ManyToOne(() => ReportDAO, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: ReportDAO;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;
}
