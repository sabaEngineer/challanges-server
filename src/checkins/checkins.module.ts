import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeCheckin } from '../challenges/entities/challenge-checkin.entity';
import { CheckinMedia } from '../challenges/entities/checkin-media.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { User } from '../users/user.entity';
import { CheckinsService } from './checkins.service';
import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChallengeCheckin,
      CheckinMedia,
      ChallengeMember,
      Challenge,
      User,
      Teammate,
    ]),
    PostsModule,
    NotificationsModule,
  ],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
