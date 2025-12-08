import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("users")
export class UserDAO {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  username!: string;

  @Column({ nullable: false })
  firstName!: string;

  @Column({ nullable: false })
  lastName!: string;

  @Column({ nullable: false })
  password!: string; // hashed con bcrypt

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({type: "boolean", default: false })
  isActive!: boolean;

  @Column({ type: "text", nullable: true })
  avatar!: string | null;

  @Column({ type: "text", nullable: true })
  telegramUsername!: string | null;

  @Column({ default: true })
  emailNotifications!: boolean;
}