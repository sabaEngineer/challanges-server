import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { CheckinMedia } from '../challenges/entities/checkin-media.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Challenge,
      ChallengeMember,
      CheckinMedia,
      Teammate,
    ]),
    PostsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
