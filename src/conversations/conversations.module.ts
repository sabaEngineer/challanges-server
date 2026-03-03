import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, MessageReaction, Teammate]),
    NotificationsModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, MessagesService],
})
export class ConversationsModule {}
