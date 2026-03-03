import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostMedia } from './entities/post-media.entity';
import { PostLike } from './entities/post-like.entity';
import { PostComment } from './entities/post-comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { ChallengeCheckin } from '../challenges/entities/challenge-checkin.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostMedia,
      PostLike,
      PostComment,
      CommentLike,
      ChallengeMember,
      ChallengeCheckin,
      Teammate,
      Challenge,
    ]),
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
