import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './entities/notification.entity';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  actorId?: string;
  subjectType: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      user_id: input.userId,
      type: input.type,
      actor_id: input.actorId,
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      payload: input.payload ?? {},
    });
    return this.notificationsRepository.save(notification);
  }

  async getNotifications(
    userId: string,
    unreadOnly: boolean,
    page: number,
    limit: number,
  ) {
    const qb = this.notificationsRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.actor', 'actor')
      .where('n.user_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (unreadOnly) {
      qb.andWhere('n.read_at IS NULL');
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        actor: n.actor
          ? {
              id: n.actor.id,
              firstName: n.actor.firstName,
              lastName: n.actor.lastName,
              picture: n.actor.picture,
            }
          : null,
        subject_type: n.subject_type,
        subject_id: n.subject_id,
        payload: n.payload,
        read_at: n.read_at,
        created_at: n.created_at,
      })),
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { user_id: userId, read_at: IsNull() },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (!notification.read_at) {
      notification.read_at = new Date();
      await this.notificationsRepository.save(notification);
    }
    return { read_at: notification.read_at };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.update(
      { user_id: userId, read_at: IsNull() },
      { read_at: new Date() },
    );
    return { success: true };
  }

  async deleteBySubject(subjectType: string, subjectId: string): Promise<void> {
    await this.notificationsRepository.delete({
      subject_type: subjectType,
      subject_id: subjectId,
    });
  }
}
