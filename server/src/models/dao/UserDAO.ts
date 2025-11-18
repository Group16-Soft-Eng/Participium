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

  @Column({ nullable: true })
  avatar!: string | null;

  @Column({ nullable: true })
  telegramUsername!: string | null;

  @Column({ default: true })
  emailNotifications!: boolean;
}