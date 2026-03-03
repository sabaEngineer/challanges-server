import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Teammate } from '../teammates/entities/teammate.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
  ) {}

  private async areTeammates(userId1: string, userId2: string): Promise<boolean> {
    const found = await this.teammatesRepository.findOne({
      where: [
        { user_id: userId1, teammate_id: userId2 },
        { user_id: userId2, teammate_id: userId1 },
      ],
    });
    return !!found;
  }

  private makePairKey(userId1: string, userId2: string): string {
    const [a, b] = [userId1, userId2].sort();
    return `${a}:${b}`;
  }

  async findOrCreate(userId: string, teammateId: string) {
    if (userId === teammateId) {
      throw new ForbiddenException('Cannot create conversation with yourself');
    }

    const areTeammates = await this.areTeammates(userId, teammateId);
    if (!areTeammates) {
      throw new ForbiddenException('Can only message teammates');
    }

    const pairKey = this.makePairKey(userId, teammateId);
    let conversation = await this.conversationsRepository.findOne({
      where: { pair_key: pairKey },
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      const [user1_id, user2_id] = [userId, teammateId].sort();
      conversation = this.conversationsRepository.create({
        user1_id,
        user2_id,
        pair_key: pairKey,
      });
      conversation = await this.conversationsRepository.save(conversation);
      conversation = await this.conversationsRepository.findOne({
        where: { id: conversation.id },
        relations: ['user1', 'user2'],
      }) as Conversation;
    }

    const otherUser =
      conversation!.user1_id === userId ? conversation!.user2 : conversation!.user1;

    return {
      id: conversation!.id,
      other_user: otherUser
        ? {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            picture: otherUser.picture,
            email: otherUser.email,
          }
        : null,
      last_message_at: conversation!.last_message_at,
      created_at: conversation!.created_at,
    };
  }

  async findByUser(userId: string, page: number, limit: number) {
    const qb = this.conversationsRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user1', 'user1')
      .leftJoinAndSelect('c.user2', 'user2')
      .where('c.user1_id = :userId OR c.user2_id = :userId', { userId })
      .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .addOrderBy('c.created_at', 'DESC');

    const [conversations, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const conversationIds = conversations.map((c) => c.id);
    const lastMessageByConv = new Map<string, Message>();
    const unreadCountByConv = new Map<string, number>();

    if (conversationIds.length > 0) {
      const allRecent = await this.messagesRepository
        .createQueryBuilder('m')
        .where('m.conversation_id IN (:...ids)', { ids: conversationIds })
        .orderBy('m.created_at', 'DESC')
        .getMany();
      for (const m of allRecent) {
        if (!lastMessageByConv.has(m.conversation_id)) {
          lastMessageByConv.set(m.conversation_id, m);
        }
      }

      for (const c of conversations) {
        const lastReadAt =
          c.user1_id === userId ? c.user1_last_read_at : c.user2_last_read_at;
        const qb = this.messagesRepository
          .createQueryBuilder('m')
          .where('m.conversation_id = :convId', { convId: c.id })
          .andWhere('m.sender_id != :userId', { userId });
        if (lastReadAt) {
          qb.andWhere('m.created_at > :lastReadAt', { lastReadAt });
        }
        const count = await qb.getCount();
        unreadCountByConv.set(c.id, count);
      }
    }

    const items = conversations.map((c) => {
      const otherUser =
        c.user1_id === userId ? c.user2 : c.user1;
      const lastMsg = lastMessageByConv.get(c.id);
      return {
        id: c.id,
        other_user: otherUser
          ? {
              id: otherUser.id,
              firstName: otherUser.firstName,
              lastName: otherUser.lastName,
              picture: otherUser.picture,
            }
          : null,
        last_message: lastMsg
          ? {
              id: lastMsg.id,
              type: lastMsg.type,
              text: lastMsg.text,
              created_at: lastMsg.created_at,
              sender_id: lastMsg.sender_id,
            }
          : null,
        last_message_at: c.last_message_at,
        unread_count: unreadCountByConv.get(c.id) ?? 0,
      };
    });

    return { items, total, page, limit };
  }

  async ensureParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.user1_id !== userId && conversation.user2_id !== userId) {
      throw new ForbiddenException('Not a participant in this conversation');
    }
    return conversation;
  }
}
