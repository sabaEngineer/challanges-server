import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { PostComment } from './post-comment.entity';
import { User } from '../../users/user.entity';

@Entity('comment_likes')
@Unique(['comment_id', 'user_id'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  comment_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => PostComment)
  @JoinColumn({ name: 'comment_id' })
  comment: PostComment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
