import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ChallengeCheckin } from './challenge-checkin.entity';

export enum PostMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('checkin_media')
export class CheckinMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  checkin_id: string;

  @Column({ type: 'enum', enum: PostMediaType })
  type: PostMediaType;

  @Column({ type: 'text' })
  url: string;

  @ManyToOne(() => ChallengeCheckin, (checkin) => checkin.media)
  @JoinColumn({ name: 'checkin_id' })
  checkin: ChallengeCheckin;

  @CreateDateColumn()
  created_at: Date;
}
