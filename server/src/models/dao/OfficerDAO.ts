import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { OfficerRole } from "@models/enums/OfficerRole";
import { OfficeType } from "@models/enums/OfficeType";
import { RoleDAO } from "./RoleDAO";
@Entity("officers")
export class OfficerDAO {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ unique: true, nullable: true})
  username!: string;
  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  surname!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false })
  password!: string; // hashed
  @OneToMany(() => RoleDAO, (role) => role.officer)
  roles!: RoleDAO[];
}