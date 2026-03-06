import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post, PostShareType } from './entities/post.entity';
import { PostMedia } from './entities/post-media.entity';
import { PostLike } from './entities/post-like.entity';
import { PostComment } from './entities/post-comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { PostMediaType } from './entities/post-media.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { ChallengeCheckin } from '../challenges/entities/challenge-checkin.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { ChallengeVisibility } from '../challenges/entities/challenge.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { formatUserForResponse } from '../users/badge';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(PostMedia)
    private readonly mediaRepository: Repository<PostMedia>,
    @InjectRepository(PostLike)
    private readonly likesRepository: Repository<PostLike>,
    @InjectRepository(PostComment)
    private readonly commentsRepository: Repository<PostComment>,
    @InjectRepository(CommentLike)
    private readonly commentLikesRepository: Repository<CommentLike>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(ChallengeCheckin)
    private readonly checkinsRepository: Repository<ChallengeCheckin>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    if (!dto.text && (!dto.media || dto.media.length === 0)) {
      throw new BadRequestException('Post must have at least text or media');
    }

    let challengeId: string | null = dto.challenge_id ?? null;
    let checkinId: string | null = dto.checkin_id ?? null;

    if (checkinId) {
      if (!challengeId) {
        throw new BadRequestException('challenge_id is required when checkin_id is provided');
      }
      const checkin = await this.checkinsRepository.findOne({
        where: { id: checkinId },
        relations: ['challenge'],
      });
      if (!checkin) {
        throw new NotFoundException('Check-in not found');
      }
      if (checkin.user_id !== userId) {
        throw new ForbiddenException('Check-in does not belong to you');
      }
      if (checkin.challenge_id !== challengeId) {
        throw new BadRequestException('Check-in must belong to the specified challenge');
      }
    }

    if (challengeId) {
      const member = await this.membersRepository.findOne({
        where: { challenge_id: challengeId, user_id: userId, status: 'active' },
      });
      if (!member) {
        throw new ForbiddenException('You must be an active member of the challenge');
      }
    }

    const post = this.postsRepository.create({
      user_id: userId,
      challenge_id: challengeId,
      checkin_id: checkinId,
      share_type: dto.share_type,
      text: dto.text,
    });

    const saved = await this.postsRepository.save(post);

    if (dto.media?.length) {
      const mediaItems = dto.media.map((m) =>
        this.mediaRepository.create({
          post_id: saved.id,
          type: m.type as PostMediaType,
          url: m.url,
          storage_key: m.storage_key,
          mime_type: m.mime_type,
          size_bytes: m.size_bytes,
          width: m.width,
          height: m.height,
          duration_seconds: m.duration_seconds,
        }),
      );
      await this.mediaRepository.save(mediaItems);
    }

    return this.findOneForResponse(saved.id, userId);
  }

  async createChallengeCreatedPost(
    userId: string,
    challengeId: string,
    text?: string,
  ): Promise<Post> {
    const post = this.postsRepository.create({
      user_id: userId,
      challenge_id: challengeId,
      share_type: PostShareType.CHALLENGE_CREATED,
      text: text ?? null,
    });
    return this.postsRepository.save(post);
  }

  async createBadgeEarnedPost(
    userId: string,
    challengeId: string,
    checkinId: string,
    badgeName: string,
  ): Promise<Post> {
    const post = this.postsRepository.create({
      user_id: userId,
      challenge_id: challengeId,
      checkin_id: checkinId,
      share_type: PostShareType.BADGE_EARNED,
      text: badgeName,
    });
    return this.postsRepository.save(post);
  }

  async update(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['media'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.user_id !== userId) {
      throw new ForbiddenException('Only the post author can update');
    }

    if (dto.text !== undefined) {
      post.text = dto.text;
    }
    if (dto.share_type !== undefined) {
      post.share_type = dto.share_type;
    }

    const finalText = post.text ?? null;
    const finalMediaCount =
      dto.media !== undefined ? dto.media.length : (post.media?.length ?? 0);
    const hasContent =
      (finalText !== null && finalText !== '') || finalMediaCount > 0;
    if (!hasContent) {
      throw new BadRequestException('Post must have at least text or media');
    }

    await this.postsRepository.save(post);

    if (dto.media !== undefined) {
      await this.mediaRepository.delete({ post_id: postId });
      if (dto.media.length > 0) {
        const mediaItems = dto.media.map((m) =>
          this.mediaRepository.create({
            post_id: postId,
            type: m.type as PostMediaType,
            url: m.url,
            storage_key: m.storage_key,
            mime_type: m.mime_type,
            size_bytes: m.size_bytes,
            width: m.width,
            height: m.height,
            duration_seconds: m.duration_seconds,
          }),
        );
        await this.mediaRepository.save(mediaItems);
      }
    }

    return this.findOneForResponse(postId, userId);
  }

  async like(userId: string, postId: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const existing = await this.likesRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
    if (existing) {
      return { liked: true, likes_count: await this.getLikesCount(postId) };
    }
    await this.likesRepository.save(
      this.likesRepository.create({ post_id: postId, user_id: userId }),
    );

    if (post.user_id !== userId) {
      await this.notificationsService.create({
        userId: post.user_id,
        type: NotificationType.POST_LIKE,
        actorId: userId,
        subjectType: 'post',
        subjectId: postId,
      });
    }

    return { liked: true, likes_count: await this.getLikesCount(postId) };
  }

  async unlike(userId: string, postId: string) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    await this.likesRepository.delete({ post_id: postId, user_id: userId });
    return { liked: false, likes_count: await this.getLikesCount(postId) };
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    await this.assertPostVisible(userId, postId);
    const comment = this.commentsRepository.create({
      post_id: postId,
      user_id: userId,
      text: dto.text.trim(),
    });
    const saved = await this.commentsRepository.save(comment);
    return this.formatComment(saved.id, userId);
  }

  async getComments(
    userId: string,
    postId: string,
    page: number,
    limit: number,
  ) {
    await this.assertPostVisible(userId, postId);
    const [comments, total] = await this.commentsRepository.findAndCount({
      where: { post_id: postId },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const items = await this.enrichCommentsWithLikes(comments, userId);
    return { items, total, page, limit };
  }

  async likeComment(userId: string, postId: string, commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, post_id: postId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.assertPostVisible(userId, postId);
    const existing = await this.commentLikesRepository.findOne({
      where: { comment_id: commentId, user_id: userId },
    });
    if (existing) {
      return {
        liked: true,
        likes_count: await this.getCommentLikesCount(commentId),
      };
    }
    await this.commentLikesRepository.save(
      this.commentLikesRepository.create({ comment_id: commentId, user_id: userId }),
    );
    return {
      liked: true,
      likes_count: await this.getCommentLikesCount(commentId),
    };
  }

  async unlikeComment(userId: string, postId: string, commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId, post_id: postId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.commentLikesRepository.delete({
      comment_id: commentId,
      user_id: userId,
    });
    return {
      liked: false,
      likes_count: await this.getCommentLikesCount(commentId),
    };
  }

  private async assertPostVisible(userId: string, postId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['challenge'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.user_id === userId) return post;
    const isTeammate = await this.teammatesRepository.findOne({
      where: [
        { user_id: userId, teammate_id: post.user_id },
        { user_id: post.user_id, teammate_id: userId },
      ],
    });
    if (!post.challenge_id) {
      if (!isTeammate) throw new NotFoundException('Post not found');
      return post;
    }
    const challenge =
      post.challenge ??
      (await this.challengesRepository.findOne({
        where: { id: post.challenge_id },
      }));
    if (!challenge) return post;
    if (challenge.visibility === ChallengeVisibility.PUBLIC) return post;
    if (
      challenge.visibility === ChallengeVisibility.TEAMMATES_ONLY &&
      isTeammate
    ) {
      return post;
    }
    throw new NotFoundException('Post not found');
  }

  private async getCommentLikesCount(commentId: string): Promise<number> {
    return this.commentLikesRepository.count({
      where: { comment_id: commentId },
    });
  }

  private async formatComment(commentId: string, requestingUserId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });
    if (!comment) return null;
    const [likes_count, isLiked] = await Promise.all([
      this.getCommentLikesCount(commentId),
      this.commentLikesRepository
        .findOne({
          where: { comment_id: commentId, user_id: requestingUserId },
        })
        .then((r) => !!r),
    ]);
    return {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      text: comment.text,
      likes_count,
      is_liked_by_me: isLiked,
      created_at: comment.created_at,
      user: comment.user ? formatUserForResponse(comment.user) : null,
    };
  }

  private async enrichCommentsWithLikes(
    comments: PostComment[],
    requestingUserId: string,
  ) {
    if (comments.length === 0) return [];
    const commentIds = comments.map((c) => c.id);
    const counts = await this.commentLikesRepository
      .createQueryBuilder('l')
      .select('l.comment_id', 'comment_id')
      .addSelect('COUNT(*)::int', 'count')
      .where('l.comment_id IN (:...ids)', { ids: commentIds })
      .groupBy('l.comment_id')
      .getRawMany();
    const countMap = new Map(
      counts.map((r) => [r.comment_id, parseInt(r.count, 10) || 0]),
    );
    const userLikes = await this.commentLikesRepository.find({
      where: {
        comment_id: In(commentIds),
        user_id: requestingUserId,
      },
    });
    const likedCommentIds = new Set(userLikes.map((l) => l.comment_id));
    return comments.map((comment) => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      text: comment.text,
      likes_count: countMap.get(comment.id) ?? 0,
      is_liked_by_me: likedCommentIds.has(comment.id),
      created_at: comment.created_at,
      user: comment.user ? formatUserForResponse(comment.user) : null,
    }));
  }

  private async getLikesCount(postId: string): Promise<number> {
    return this.likesRepository.count({ where: { post_id: postId } });
  }

  async getFeed(userId: string, page: number, limit: number) {
    const asTeammate = await this.teammatesRepository
      .createQueryBuilder('t')
      .select('t.teammate_id', 'id')
      .where('t.user_id = :userId', { userId })
      .getRawMany();
    const asUser = await this.teammatesRepository
      .createQueryBuilder('t')
      .select('t.user_id', 'id')
      .where('t.teammate_id = :userId', { userId })
      .getRawMany();
    const ids = [
      ...new Set([
        userId,
        ...asTeammate.map((r) => r.id),
        ...asUser.map((r) => r.id),
      ]),
    ];

    const [posts, total] = await this.postsRepository.findAndCount({
      where: { user_id: In(ids) },
      relations: ['user', 'challenge', 'checkin', 'checkin.member', 'media'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (posts.length > 0) {
      const items = await this.enrichPostsWithLikes(posts, userId);
      return { items, total, page, limit, is_discover: false };
    }

    return this.getDiscoverFeed(userId, page, limit);
  }

  private async getDiscoverFeed(userId: string, page: number, limit: number) {
    const publicChallengeIds = await this.challengesRepository
      .createQueryBuilder('c')
      .select('c.id', 'id')
      .where('c.visibility = :visibility', { visibility: ChallengeVisibility.PUBLIC })
      .getRawMany();

    if (publicChallengeIds.length === 0) {
      return { items: [], total: 0, page, limit, is_discover: true };
    }

    const challengeIds = publicChallengeIds.map((c) => c.id);

    const [posts, total] = await this.postsRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.challenge', 'challenge')
      .leftJoinAndSelect('p.checkin', 'checkin')
      .leftJoinAndSelect('checkin.member', 'member')
      .leftJoinAndSelect('p.media', 'media')
      .where('p.challenge_id IN (:...challengeIds)', { challengeIds })
      .andWhere('p.user_id != :userId', { userId })
      .orderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = await this.enrichPostsWithLikes(posts, userId);
    return { items, total, page, limit, is_discover: true };
  }

  async getByChallenge(userId: string, challengeId: string, page: number, limit: number) {
    const member = await this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, status: 'active' },
    });
    if (!member) {
      throw new ForbiddenException('You do not have access to this challenge');
    }

    const [posts, total] = await this.postsRepository.findAndCount({
      where: { challenge_id: challengeId },
      relations: ['user', 'challenge', 'checkin', 'checkin.member', 'media'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = await this.enrichPostsWithLikes(posts, userId);
    return { items, total, page, limit };
  }

  async getByUser(
    requestingUserId: string,
    targetUserId: string,
    page: number,
    limit: number,
  ) {
    const isTeammate = await this.teammatesRepository.findOne({
      where: [
        { user_id: requestingUserId, teammate_id: targetUserId },
        { user_id: targetUserId, teammate_id: requestingUserId },
      ],
    });

    const targetMemberships = await this.membersRepository.find({
      where: { user_id: targetUserId, status: 'active' },
      relations: ['challenge'],
    });

    const visibleChallengeIds = targetMemberships
      .filter((m) => {
        const c = m.challenge;
        if (!c) return false;
        if (c.visibility === ChallengeVisibility.PUBLIC) return true;
        if (c.visibility === ChallengeVisibility.TEAMMATES_ONLY && isTeammate)
          return true;
        return false;
      })
      .map((m) => m.challenge_id);

    const conditions: string[] = [];
    const params: Record<string, unknown> = { targetUserId };

    if (isTeammate) {
      conditions.push('(p.challenge_id IS NULL)');
    }
    if (visibleChallengeIds.length > 0) {
      conditions.push('(p.challenge_id IN (:...visibleChallengeIds))');
      params.visibleChallengeIds = visibleChallengeIds;
    }

    if (conditions.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const qb = this.postsRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.challenge', 'challenge')
      .leftJoinAndSelect('p.checkin', 'checkin')
      .leftJoinAndSelect('checkin.member', 'member')
      .leftJoinAndSelect('p.media', 'media')
      .where('p.user_id = :targetUserId', params)
      .andWhere(`(${conditions.join(' OR ')})`)
      .orderBy('p.created_at', 'DESC');

    const [posts, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = await this.enrichPostsWithLikes(posts, requestingUserId);
    return { items, total, page, limit };
  }

  async getById(userId: string, postId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['user', 'challenge', 'checkin', 'checkin.member', 'media'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isTeammate = await this.teammatesRepository.findOne({
      where: [
        { user_id: userId, teammate_id: post.user_id },
        { user_id: post.user_id, teammate_id: userId },
      ],
    });

    if (post.user_id === userId) {
      return await this.formatPostDetail(post, userId);
    }

    if (!post.challenge_id) {
      if (!isTeammate) {
        throw new NotFoundException('Post not found');
      }
      return await this.formatPostDetail(post, userId);
    }

    const challenge = post.challenge ?? (await this.challengesRepository.findOne({
      where: { id: post.challenge_id },
    }));
    if (!challenge) {
      return await this.formatPostDetail(post, userId);
    }
    if (challenge.visibility === ChallengeVisibility.PUBLIC) {
      return await this.formatPostDetail(post, userId);
    }
    if (challenge.visibility === ChallengeVisibility.TEAMMATES_ONLY && isTeammate) {
      return await this.formatPostDetail(post, userId);
    }

    throw new NotFoundException('Post not found');
  }

  async delete(userId: string, postId: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.user_id !== userId) {
      throw new ForbiddenException('Only the post author can delete');
    }
    await this.postsRepository.remove(post);
    return { success: true };
  }

  private async enrichPostsWithLikes(
    posts: Post[],
    requestingUserId: string,
  ): Promise<unknown[]> {
    if (posts.length === 0) return [];
    const postIds = posts.map((p) => p.id);
    const [counts, commentCounts, allLatestComments, userLikes] =
      await Promise.all([
        this.likesRepository
          .createQueryBuilder('l')
          .select('l.post_id', 'post_id')
          .addSelect('COUNT(*)::int', 'count')
          .where('l.post_id IN (:...ids)', { ids: postIds })
          .groupBy('l.post_id')
          .getRawMany(),
        this.commentsRepository
          .createQueryBuilder('c')
          .select('c.post_id', 'post_id')
          .addSelect('COUNT(*)::int', 'count')
          .where('c.post_id IN (:...ids)', { ids: postIds })
          .groupBy('c.post_id')
          .getRawMany(),
        postIds.length > 0
          ? this.commentsRepository
              .createQueryBuilder('c')
              .leftJoinAndSelect('c.user', 'u')
              .where('c.post_id IN (:...ids)', { ids: postIds })
              .andWhere(
                `c.id = (
                  SELECT id FROM post_comments
                  WHERE post_id = c.post_id
                  ORDER BY created_at DESC
                  LIMIT 1
                )`,
              )
              .getMany()
          : Promise.resolve([]),
        this.likesRepository.find({
          where: { post_id: In(postIds), user_id: requestingUserId },
        }),
      ]);

    const countMap = new Map(
      counts.map((r) => [r.post_id, parseInt(r.count, 10) || 0]),
    );
    const commentCountMap = new Map(
      commentCounts.map((r) => [r.post_id, parseInt(r.count, 10) || 0]),
    );
    const likedPostIds = new Set(userLikes.map((l) => l.post_id));

    const lastCommentByPost = new Map<string, PostComment>();
    for (const c of allLatestComments) {
      if (!lastCommentByPost.has(c.post_id)) {
        lastCommentByPost.set(c.post_id, c);
      }
    }

    const lastCommentIds = [...lastCommentByPost.values()].map((c) => c.id);
    const [lastCommentLikes, lastCommentUserLikes] =
      lastCommentIds.length > 0
        ? await Promise.all([
            this.commentLikesRepository
              .createQueryBuilder('l')
              .select('l.comment_id', 'comment_id')
              .addSelect('COUNT(*)::int', 'count')
              .where('l.comment_id IN (:...ids)', { ids: lastCommentIds })
              .groupBy('l.comment_id')
              .getRawMany(),
            this.commentLikesRepository.find({
              where: {
                comment_id: In(lastCommentIds),
                user_id: requestingUserId,
              },
            }),
          ])
        : [[], []];

    const lastCommentLikeMap = new Map(
      (lastCommentLikes as { comment_id: string; count: string }[]).map(
        (r) => [r.comment_id, parseInt(r.count, 10) || 0],
      ),
    );
    const lastCommentLikedByMe = new Set(
      (lastCommentUserLikes as { comment_id: string }[]).map(
        (l) => l.comment_id,
      ),
    );

    return posts.map((post) => {
      const lastComment = lastCommentByPost.get(post.id);
      return {
        ...this.formatPostForFeed(post),
        likes_count: countMap.get(post.id) ?? 0,
        is_liked_by_me: likedPostIds.has(post.id),
        comments_count: commentCountMap.get(post.id) ?? 0,
        last_comment: lastComment
          ? {
              id: lastComment.id,
              text: lastComment.text,
              created_at: lastComment.created_at,
              likes_count: lastCommentLikeMap.get(lastComment.id) ?? 0,
              is_liked_by_me: lastCommentLikedByMe.has(lastComment.id),
              user: lastComment.user
                ? formatUserForResponse(lastComment.user)
                : null,
            }
          : null,
      };
    });
  }

  private async formatPostDetail(post: Post, requestingUserId: string) {
    const [likes_count, isLiked, comments_count, lastComment] =
      await Promise.all([
        this.getLikesCount(post.id),
        this.likesRepository
          .findOne({ where: { post_id: post.id, user_id: requestingUserId } })
          .then((r) => !!r),
        this.commentsRepository.count({ where: { post_id: post.id } }),
        this.commentsRepository.findOne({
          where: { post_id: post.id },
          relations: ['user'],
          order: { created_at: 'DESC' },
        }),
      ]);

    let last_comment: Record<string, unknown> | null = null;
    if (lastComment) {
      const [lcLikes, lcLikedByMe] = await Promise.all([
        this.getCommentLikesCount(lastComment.id),
        this.commentLikesRepository
          .findOne({
            where: {
              comment_id: lastComment.id,
              user_id: requestingUserId,
            },
          })
          .then((r) => !!r),
      ]);
      last_comment = {
        id: lastComment.id,
        text: lastComment.text,
        created_at: lastComment.created_at,
        likes_count: lcLikes,
        is_liked_by_me: lcLikedByMe,
        user: lastComment.user
          ? formatUserForResponse(lastComment.user)
          : null,
      };
    }

    return {
      id: post.id,
      user_id: post.user_id,
      challenge_id: post.challenge_id,
      checkin_id: post.checkin_id,
      share_type: post.share_type,
      text: post.text,
      likes_count,
      is_liked_by_me: isLiked,
      comments_count,
      last_comment,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user: post.user ? formatUserForResponse(post.user) : null,
      challenge: post.challenge
        ? { id: post.challenge.id, title: post.challenge.title }
        : null,
      checkin: post.checkin
        ? {
            id: post.checkin.id,
            status: post.checkin.status,
            current_streak: post.checkin.member?.current_streak ?? 0,
          }
        : null,
      media:
        post.media?.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          storage_key: m.storage_key,
          mime_type: m.mime_type,
          width: m.width,
          height: m.height,
          duration_seconds: m.duration_seconds,
          created_at: m.created_at,
        })) ?? [],
    };
  }

  private formatPostForFeed(post: Post) {
    return {
      id: post.id,
      share_type: post.share_type,
      text: post.text,
      created_at: post.created_at,
      user: post.user ? formatUserForResponse(post.user) : null,
      challenge: post.challenge
        ? { id: post.challenge.id, title: post.challenge.title }
        : null,
      checkin: post.checkin
        ? {
            id: post.checkin.id,
            status: post.checkin.status,
            current_streak: post.checkin.member?.current_streak ?? 0,
          }
        : null,
      media:
        post.media?.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })) ?? [],
    };
  }

  private async findOneForResponse(postId: string, userId?: string) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: ['media'],
    });
    if (!post) return null;
    const likes_count = await this.getLikesCount(postId);
    const is_liked_by_me =
      userId != null
        ? (await this.likesRepository.findOne({
            where: { post_id: postId, user_id: userId },
          })) != null
        : false;
    return {
      id: post.id,
      user_id: post.user_id,
      challenge_id: post.challenge_id,
      checkin_id: post.checkin_id,
      share_type: post.share_type,
      text: post.text,
      created_at: post.created_at,
      likes_count,
      is_liked_by_me,
      media:
        post.media?.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })) ?? [],
    };
  }
}
