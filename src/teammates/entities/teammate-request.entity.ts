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

export enum TeammateRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELED = 'canceled',
  BLOCKED = 'blocked',
}

@Entity('teammate_requests')
export class TeammateRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requester_id: string;

  @Column({ type: 'uuid' })
  addressee_id: string;

  @Column({
    type: 'enum',
    enum: TeammateRequestStatus,
    default: TeammateRequestStatus.PENDING,
  })
  status: TeammateRequestStatus;

  @Column({ type: 'timestamp', nullable: true })
  responded_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'addressee_id' })
  addressee: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
