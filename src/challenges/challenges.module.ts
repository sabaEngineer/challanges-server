import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeMember } from './entities/challenge-member.entity';
import { ChallengeCheckin } from './entities/challenge-checkin.entity';
import { ChallengeInvite } from './entities/challenge-invite.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { CheckinsModule } from '../checkins/checkins.module';
import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeMember, ChallengeCheckin, ChallengeInvite, Teammate]),
    CheckinsModule,
    PostsModule,
    NotificationsModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
