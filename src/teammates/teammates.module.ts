import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeammateRequest } from './entities/teammate-request.entity';
import { Teammate } from './entities/teammate.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { User } from '../users/user.entity';
import { TeammatesController } from './teammates.controller';
import { TeammatesService } from './teammates.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      TeammateRequest,
      Teammate,
      ChallengeMember,
      Challenge,
      User,
    ]),
  ],
  controllers: [TeammatesController],
  providers: [TeammatesService],
  exports: [TeammatesService],
})
export class TeammatesModule {}
