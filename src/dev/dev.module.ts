import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { TeammateRequest } from '../teammates/entities/teammate-request.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ChallengeMember,
      Teammate,
      TeammateRequest,
      Notification,
      Conversation,
    ]),
  ],
  controllers: [DevController],
  providers: [DevService],
})
export class DevModule {}
