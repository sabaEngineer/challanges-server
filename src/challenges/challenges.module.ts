import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeMember } from './entities/challenge-member.entity';
import { ChallengeCheckin } from './entities/challenge-checkin.entity';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { CheckinsModule } from '../checkins/checkins.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeMember, ChallengeCheckin]),
    CheckinsModule,
    PostsModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
