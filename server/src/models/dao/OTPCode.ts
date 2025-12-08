import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { UserDAO } from "./UserDAO";

@Entity("otp_codes")
export class OTPCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  code!: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    date!: Date;

  @Column({ type: "int", nullable: false })
  userId!: number;

  @Column({ default: false })
  used!: boolean;
}