import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";

@Entity("officers")
export class OfficerDAO {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  surname!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false })
  password!: string; // hashed

  @Column({ type: "varchar", nullable: true })
  role!: OfficerRole;

  @Column({ type: "varchar", nullable: true })
  office!: OfficeType;
}