import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum NotificationType {
  TEAMMATE_REQUEST = 'teammate_request',
  MESSAGE = 'message',
  REACTION_ON_CHECKIN = 'reaction_on_checkin',
  REACTION_ON_COMMENT = 'reaction_on_comment',
  COMMENT_ON_CHECKIN = 'comment_on_checkin',
  POST_LIKE = 'post_like',
  CHALLENGE_CREATED = 'challenge_created',
  CHALLENGE_INVITE = 'challenge_invite',
  BADGE_EARNED = 'badge_earned',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'uuid', nullable: true })
  actor_id: string;

  @Column({ type: 'varchar', length: 100 })
  subject_type: string;

  @Column({ type: 'uuid', nullable: true })
  subject_id: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
