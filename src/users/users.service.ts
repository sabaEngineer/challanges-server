import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { ChallengeVisibility } from '../challenges/entities/challenge.entity';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
    private readonly postsService: PostsService,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async updateUser(
    user: User,
    updates: Partial<
      Pick<User, 'firstName' | 'lastName' | 'picture' | 'pushToken' | 'skip_build_team'>
    >,
  ): Promise<User> {
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async getPublicProfile(
    requestingUserId: string,
    targetUserId: string,
    recentPostsLimit = 10,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limit = Math.min(Math.max(1, recentPostsLimit), 50);
    const { items: recentPosts } = await this.postsService.getByUser(
      requestingUserId,
      targetUserId,
      1,
      limit,
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      email: user.email,
      created_at: user.created_at,
      recent_posts: recentPosts,
    };
  }

  async getMyRecentPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: unknown[]; total: number; page: number; limit: number }> {
    return this.postsService.getByUser(userId, userId, page, limit);
  }

  async getUserChallenges(
    requestingUserId: string,
    targetUserId: string,
    page: number,
    limit: number,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isTeammate = await this.teammatesRepository.findOne({
      where: [
        { user_id: requestingUserId, teammate_id: targetUserId },
        { user_id: targetUserId, teammate_id: requestingUserId },
      ],
    });

    const memberships = await this.membersRepository.find({
      where: { user_id: targetUserId, status: 'active' },
      relations: ['challenge'],
    });

    const visibleChallenges = memberships.filter((m) => {
      const c = m.challenge;
      if (!c) return false;
      if (c.visibility === ChallengeVisibility.PUBLIC) return true;
      if (c.visibility === ChallengeVisibility.TEAMMATES_ONLY && isTeammate)
        return true;
      return false;
    });

    const challengeIds = visibleChallenges.map((m) => m.challenge_id);
    if (challengeIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const [challenges, total] = await this.challengesRepository.findAndCount({
      where: { id: In(challengeIds) },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const counts = await this.membersRepository
      .createQueryBuilder('m')
      .select('m.challenge_id', 'challenge_id')
      .addSelect('COUNT(*)::int', 'count')
      .where('m.challenge_id IN (:...ids)', { ids: challenges.map((c) => c.id) })
      .andWhere('m.status = :status', { status: 'active' })
      .groupBy('m.challenge_id')
      .getRawMany();

    const countMap = new Map(
      counts.map((r) => [r.challenge_id, parseInt(r.count, 10) || 0]),
    );

    const streakMap = new Map(
      visibleChallenges.map((m) => [
        m.challenge_id,
        {
          current_streak: m.current_streak,
          best_streak: m.best_streak,
        },
      ]),
    );

    const items = challenges.map((c) => {
      const streaks = streakMap.get(c.id);
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        imageUrl: c.imageUrl,
        visibility: c.visibility,
        type: c.type,
        start_date: c.start_date,
        end_date: c.end_date,
        member_count: countMap.get(c.id) || 0,
        created_at: c.created_at,
        current_streak: streaks?.current_streak ?? 0,
        best_streak: streaks?.best_streak ?? 0,
      };
    });

    return { items, total, page, limit };
  }

  async findOrCreateByGoogle(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }): Promise<User> {
    let user = await this.findByGoogleId(profile.googleId);

    if (user) {
      return user;
    }

    user = await this.findByEmail(profile.email);

    if (user) {
      user.googleId = profile.googleId;
      return this.usersRepository.save(user);
    }

    const newUser = this.usersRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
    });

    return this.usersRepository.save(newUser);
  }
}
