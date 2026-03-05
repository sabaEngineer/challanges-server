import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { ChallengeMember } from './challenge-member.entity';

export enum ChallengeVisibility {
  PUBLIC = 'public',
  TEAMMATES_ONLY = 'teammates_only',
  PRIVATE_INVITE = 'private_invite',
}

export enum ChallengeType {
  STRICT = 'strict',
  FLEXIBLE = 'flexible',
}

export enum CheckinMediaRequirement {
  NONE = 'none',
  IMAGE_OR_VIDEO_REQUIRED = 'image_or_video_required',
  IMAGE_REQUIRED = 'image_required',
  VIDEO_REQUIRED = 'video_required',
}

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: ChallengeVisibility,
    default: ChallengeVisibility.PUBLIC,
  })
  visibility: ChallengeVisibility;

  @Column({ type: 'enum', enum: ChallengeType })
  type: ChallengeType;

  @Column({
    type: 'enum',
    enum: CheckinMediaRequirement,
    default: CheckinMediaRequirement.NONE,
  })
  media_requirement: CheckinMediaRequirement;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ type: 'text', nullable: true })
  system_advice: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => ChallengeMember, (member) => member.challenge)
  members: ChallengeMember[];

  @CreateDateColumn()
  created_at: Date;
}
