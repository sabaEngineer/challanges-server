import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { Challenge } from './challenge.entity';
import { ChallengeMember } from './challenge-member.entity';
import { User } from '../../users/user.entity';
import { CheckinMedia } from './checkin-media.entity';

export enum CheckinStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('challenge_checkins')
@Unique(['member_id', 'checkin_date'])
export class ChallengeCheckin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  challenge_id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'uuid' })
  member_id: string;

  @Column({ type: 'date' })
  @Index()
  checkin_date: string;

  @Column({ type: 'enum', enum: CheckinStatus })
  status: CheckinStatus;

  @Column({ type: 'text', nullable: true })
  text: string;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @ManyToOne(() => ChallengeMember)
  @JoinColumn({ name: 'member_id' })
  member: ChallengeMember;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => CheckinMedia, (media) => media.checkin)
  media: CheckinMedia[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
