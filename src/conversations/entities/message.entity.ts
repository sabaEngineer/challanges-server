import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../users/user.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    enumName: 'message_status',
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column({ type: 'text', nullable: true })
  image_storage_key: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  image_mime_type: string;

  @Column({ type: 'bigint', nullable: true })
  image_size_bytes: number;

  @Column({ type: 'int', nullable: true })
  image_width: number;

  @Column({ type: 'int', nullable: true })
  image_height: number;

  @Column({ type: 'text', nullable: true })
  video_url: string;

  @Column({ type: 'text', nullable: true })
  video_storage_key: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  video_mime_type: string;

  @Column({ type: 'bigint', nullable: true })
  video_size_bytes: number;

  @Column({ type: 'int', nullable: true })
  video_duration_seconds: number;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
