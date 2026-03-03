import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeCheckin } from '../challenges/entities/challenge-checkin.entity';
import { CheckinMedia } from '../challenges/entities/checkin-media.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { CheckinsService } from './checkins.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChallengeCheckin,
      CheckinMedia,
      ChallengeMember,
      Challenge,
    ]),
  ],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
