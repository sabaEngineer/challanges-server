import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from './post.entity';

export enum PostMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('post_media')
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  post_id: string;

  @Column({
    type: 'enum',
    enum: PostMediaType,
    enumName: 'post_media_type',
  })
  type: PostMediaType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  storage_key: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'bigint', nullable: true })
  size_bytes: number;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'float', nullable: true })
  duration_seconds: number;

  @ManyToOne(() => Post, (post) => post.media)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @CreateDateColumn()
  created_at: Date;
}
