import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { TeammateRequest } from '../teammates/entities/teammate-request.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class DevService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
    @InjectRepository(TeammateRequest)
    private readonly requestsRepository: Repository<TeammateRequest>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
  ) {}

  async resetUserProgress(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) return null;

    const userId = user.id;

    const membersResult = await this.membersRepository.delete({
      user_id: userId,
    });
    await this.teammatesRepository.delete({ user_id: userId });
    await this.teammatesRepository.delete({ teammate_id: userId });
    await this.requestsRepository.delete({ requester_id: userId });
    await this.requestsRepository.delete({ addressee_id: userId });
    await this.notificationsRepository.delete({ user_id: userId });
    await this.notificationsRepository.delete({ actor_id: userId });
    await this.conversationsRepository.delete({ user1_id: userId });
    await this.conversationsRepository.delete({ user2_id: userId });

    return {
      success: true,
      message: `Progress reset for ${email}`,
      deleted: {
        challenge_members: membersResult.affected ?? 0,
        teammates: true,
        requests: true,
        notifications: true,
        conversations: true,
      },
    };
  }
}
