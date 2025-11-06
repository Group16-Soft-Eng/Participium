import { OfficerRole } from './officer-role';
import { OfficeType } from './office-type';


import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('officers')
export class Officer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  role: string; // OfficerRole enum come stringa

  @Column()
  office: string; // OfficeType enum come stringa
}

