import { ReportDocument } from './report-document';
import { OfficeType } from './office-type';
import { Location } from './location';

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('simple-json')
  location: {
    id?: number;
    name?: string;
    Coordinates?: {
      longitude: number;
      latitude: number;
    };
  };

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ default: false })
  anonymity: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column()
  category: string; // OfficeType enum

  @Column('simple-json')
  document: {
    Description?: string;
    Photos?: string[];
  };
}

