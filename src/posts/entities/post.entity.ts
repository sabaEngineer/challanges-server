import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { ChallengeCheckin } from '../../challenges/entities/challenge-checkin.entity';
import { PostMedia } from './post-media.entity';

export enum PostShareType {
  WIN = 'win',
  LEARNED = 'learned',
  ADVICE = 'advice',
  MOTIVATE = 'motivate',
  MOMENT = 'moment',
  LESSON = 'lesson',
  NEXT_TIME = 'next_time',
  HONESTY = 'honesty',
  SUPPORT = 'support',
  GENERAL = 'general',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  challenge_id: string;

  @Column({ type: 'uuid', nullable: true })
  checkin_id: string;

  @Column({
    type: 'enum',
    enum: PostShareType,
    enumName: 'post_share_type',
  })
  share_type: PostShareType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  text: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Challenge)
  @JoinColumn({ name: 'challenge_id' })
  challenge: Challenge;

  @ManyToOne(() => ChallengeCheckin)
  @JoinColumn({ name: 'checkin_id' })
  checkin: ChallengeCheckin;

  @OneToMany(() => PostMedia, (media) => media.post)
  media: PostMedia[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
