import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import {
  MessageReaction,
  ReactionType,
} from './entities/message-reaction.entity';
import { MessageType, MessageStatus } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsService } from './conversations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(MessageReaction)
    private readonly reactionsRepository: Repository<MessageReaction>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    private readonly conversationsService: ConversationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async send(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation =
      await this.conversationsService.ensureParticipant(conversationId, userId);

    const type = dto.type ?? MessageType.TEXT;

    if (type === MessageType.TEXT) {
      if (dto.text === undefined || dto.text === null) {
        throw new BadRequestException('Text is required for text messages');
      }
    } else if (type === MessageType.IMAGE) {
      if (!dto.image_url) {
        throw new BadRequestException('image_url is required for image messages');
      }
    } else if (type === MessageType.VIDEO) {
      if (!dto.video_url) {
        throw new BadRequestException('video_url is required for video messages');
      }
    }

    const message = this.messagesRepository.create({
      conversation_id: conversationId,
      sender_id: userId,
      type,
      text: dto.text,
      image_url: dto.image_url,
      image_storage_key: dto.image_storage_key,
      image_mime_type: dto.image_mime_type,
      image_size_bytes: dto.image_size_bytes,
      image_width: dto.image_width,
      image_height: dto.image_height,
      video_url: dto.video_url,
      video_storage_key: dto.video_storage_key,
      video_mime_type: dto.video_mime_type,
      video_size_bytes: dto.video_size_bytes,
      video_duration_seconds: dto.video_duration_seconds,
    });

    const saved = await this.messagesRepository.save(message);

    const response: Record<string, unknown> = {
      id: saved.id,
      conversation_id: saved.conversation_id,
      sender_id: saved.sender_id,
      type: saved.type,
      status: saved.status,
      text: saved.text,
      image_url: saved.image_url,
      image_storage_key: saved.image_storage_key,
      image_mime_type: saved.image_mime_type,
      image_size_bytes: saved.image_size_bytes
        ? parseInt(String(saved.image_size_bytes), 10)
        : null,
      image_width: saved.image_width,
      image_height: saved.image_height,
      video_url: saved.video_url,
      video_storage_key: saved.video_storage_key,
      video_mime_type: saved.video_mime_type,
      video_size_bytes: saved.video_size_bytes
        ? parseInt(String(saved.video_size_bytes), 10)
        : null,
      video_duration_seconds: saved.video_duration_seconds,
      created_at: saved.created_at,
      reaction: null,
    };
    if (dto.client_temp_id != null) {
      response.client_temp_id = dto.client_temp_id;
    }

    await this.conversationsRepository.update(
      { id: conversationId },
      { last_message_at: saved.created_at },
    );

    const recipientId =
      conversation.user1_id === userId
        ? conversation.user2_id
        : conversation.user1_id;

    await this.notificationsService.create({
      userId: recipientId,
      type: NotificationType.MESSAGE,
      actorId: userId,
      subjectType: 'message',
      subjectId: saved.id,
    });

    return response;
  }

  async findByConversation(
    userId: string,
    conversationId: string,
    page: number,
    limit: number,
  ) {
    const conversation =
      await this.conversationsService.ensureParticipant(conversationId, userId);

    await this.conversationsRepository.update(
      { id: conversationId },
      conversation.user1_id === userId
        ? { user1_last_read_at: new Date() }
        : { user2_last_read_at: new Date() },
    );

    const [messages, total] = await this.messagesRepository.findAndCount({
      where: { conversation_id: conversationId },
      order: { created_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const messageIds = messages.map((m) => m.id);
    const reactions =
      messageIds.length > 0
        ? await this.reactionsRepository.find({
            where: { message_id: In(messageIds) },
          })
        : [];
    const reactionByMessage = new Map(
      reactions.map((r) => [r.message_id, r]),
    );

    const items = messages.map((m) => {
      const reaction = reactionByMessage.get(m.id);
      return {
      id: m.id,
      sender_id: m.sender_id,
      type: m.type,
      status: m.status,
      text: m.text,
      image_url: m.image_url,
      image_storage_key: m.image_storage_key,
      image_mime_type: m.image_mime_type,
      image_size_bytes: m.image_size_bytes
        ? parseInt(String(m.image_size_bytes), 10)
        : null,
      image_width: m.image_width,
      image_height: m.image_height,
      video_url: m.video_url,
      video_storage_key: m.video_storage_key,
      video_mime_type: m.video_mime_type,
      video_size_bytes: m.video_size_bytes
        ? parseInt(String(m.video_size_bytes), 10)
        : null,
      video_duration_seconds: m.video_duration_seconds,
      created_at: m.created_at,
      reaction: reaction
        ? {
            reaction_type: reaction.reaction_type,
            user_id: reaction.user_id,
          }
        : null,
      };
    });

    return { items, total, page, limit };
  }

  async setReaction(
    userId: string,
    conversationId: string,
    messageId: string,
    reactionType: ReactionType | null,
  ) {
    await this.conversationsService.ensureParticipant(conversationId, userId);

    const message = await this.messagesRepository.findOne({
      where: { id: messageId, conversation_id: conversationId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const existing = await this.reactionsRepository.findOne({
      where: { message_id: messageId },
    });

    if (!reactionType) {
      if (existing) {
        await this.reactionsRepository.remove(existing);
      }
      return { reaction: null };
    }

    const reaction = existing
      ? await this.reactionsRepository.save({
          ...existing,
          user_id: userId,
          reaction_type: reactionType as ReactionType,
        })
      : await this.reactionsRepository.save(
          this.reactionsRepository.create({
            message_id: messageId,
            user_id: userId,
            reaction_type: reactionType as ReactionType,
          }),
        );

    return {
      reaction: {
        reaction_type: reaction.reaction_type,
        user_id: reaction.user_id,
      },
    };
  }

  async markAsRead(
    userId: string,
    conversationId: string,
    messageIds?: string[],
  ): Promise<{ updated: number }> {
    await this.conversationsService.ensureParticipant(conversationId, userId);

    const qb = this.messagesRepository
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId });

    if (messageIds && messageIds.length > 0) {
      qb.andWhere('id IN (:...ids)', { ids: messageIds });
    }

    const result = await qb.execute();
    return { updated: result.affected ?? 0 };
  }
}
