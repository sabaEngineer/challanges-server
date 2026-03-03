import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengeMember } from './entities/challenge-member.entity';
import { ChallengeCheckin } from './entities/challenge-checkin.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { MembersSortBy } from './dto/challenge-members-query.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(ChallengeCheckin)
    private readonly checkinsRepository: Repository<ChallengeCheckin>,
  ) {}

  async create(userId: string, dto: CreateChallengeDto): Promise<Challenge> {
    const challenge = this.challengesRepository.create({
      ...dto,
      created_by: userId,
    });

    const saved = await this.challengesRepository.save(challenge);

    const member = this.membersRepository.create({
      challenge_id: saved.id,
      user_id: userId,
      status: 'active',
    });
    await this.membersRepository.save(member);

    return saved;
  }

  async delete(userId: string, challengeId: string): Promise<void> {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.created_by !== userId) {
      throw new ForbiddenException('Only the creator can delete this challenge');
    }

    await this.challengesRepository.remove(challenge);
  }

  async update(
    userId: string,
    challengeId: string,
    dto: UpdateChallengeDto,
  ): Promise<Challenge> {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.created_by !== userId) {
      throw new ForbiddenException('Only the creator can update this challenge');
    }

    Object.assign(challenge, dto);
    return this.challengesRepository.save(challenge);
  }

  async join(userId: string, challengeId: string) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const existing = await this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId },
    });

    if (existing && existing.status === 'active') {
      throw new ConflictException('Already a member of this challenge');
    }

    if (existing) {
      existing.status = 'active';
      return this.membersRepository.save(existing);
    }

    const member = this.membersRepository.create({
      challenge_id: challengeId,
      user_id: userId,
      status: 'active',
    });

    return this.membersRepository.save(member);
  }

  async findByUser(userId: string) {
    const memberships = await this.membersRepository.find({
      where: { user_id: userId, status: 'active' },
      relations: ['challenge', 'challenge.creator'],
    });

    const challengeIds = memberships.map((m) => m.challenge_id);
    const memberCounts = await this.getMemberCounts(challengeIds);

    const today = new Date().toISOString().split('T')[0];
    const memberIds = memberships.map((m) => m.id);
    const todayCheckins = await this.checkinsRepository.find({
      where: { member_id: In(memberIds), checkin_date: today },
    });
    const todayByMember = new Map(
      todayCheckins.map((c) => [c.member_id, c.status]),
    );

    return memberships.map((m) => ({
      ...m.challenge,
      current_streak: m.current_streak,
      best_streak: m.best_streak,
      joined_at: m.joined_at,
      member_status: m.status,
      member_count: memberCounts[m.challenge_id] || 0,
      today_completed: todayByMember.get(m.id) === 'success',
      today_checkin_status: todayByMember.get(m.id) ?? null,
    }));
  }

  async findPublic(page: number, limit: number) {
    const challenges = await this.challengesRepository
      .createQueryBuilder('c')
      .leftJoin('challenge_members', 'm', 'm.challenge_id = c.id AND m.status = :status', { status: 'active' })
      .leftJoinAndSelect('c.creator', 'creator')
      .where('c.visibility = :visibility', { visibility: 'public' })
      .groupBy('c.id')
      .addGroupBy('creator.id')
      .addSelect('COUNT(m.id)::int', 'member_count')
      .orderBy('COUNT(m.id)', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawAndEntities();

    const rawMap = new Map(
      challenges.raw.map((r) => [r.c_id, parseInt(r.member_count, 10) || 0]),
    );

    return challenges.entities.map((c) => ({
      ...c,
      member_count: rawMap.get(c.id) || 0,
    }));
  }

  async findCheckins(
    userId: string,
    challengeId: string,
    page: number,
    limit: number,
  ) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const membership = await this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, status: 'active' },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this challenge');
    }

    const [checkins, total] = await this.checkinsRepository.findAndCount({
      where: { challenge_id: challengeId },
      relations: ['user', 'media', 'member'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: checkins.map((c) => ({
        id: c.id,
        challenge_id: c.challenge_id,
        user_id: c.user_id,
        checkin_date: c.checkin_date,
        status: c.status,
        text: c.text,
        created_at: c.created_at,
        current_streak: c.member?.current_streak ?? 0,
        best_streak: c.member?.best_streak ?? 0,
        user: c.user
          ? {
              id: c.user.id,
              firstName: c.user.firstName,
              lastName: c.user.lastName,
              picture: c.user.picture,
            }
          : null,
        media: c.media?.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })) ?? [],
      })),
      total,
      page,
      limit,
    };
  }

  async findMembers(
    challengeId: string,
    page: number,
    limit: number,
    sortBy: MembersSortBy,
  ) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const qb = this.membersRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'user')
      .where('m.challenge_id = :challengeId', { challengeId })
      .andWhere('m.status = :status', { status: 'active' });

    const total = await qb.getCount();

    const orderColumn =
      sortBy === MembersSortBy.JOINED_AT ? 'm.joined_at' : `m.${sortBy}`;
    const members = await qb
      .orderBy(orderColumn, 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        joined_at: m.joined_at,
        current_streak: m.current_streak,
        best_streak: m.best_streak,
        user: m.user
          ? {
              id: m.user.id,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              picture: m.user.picture,
              email: m.user.email,
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  async findById(challengeId: string) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
      relations: ['creator'],
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const memberCounts = await this.getMemberCounts([challengeId]);

    return {
      ...challenge,
      member_count: memberCounts[challengeId] || 0,
    };
  }

  private async getMemberCounts(
    challengeIds: string[],
  ): Promise<Record<string, number>> {
    if (challengeIds.length === 0) return {};

    const counts = await this.membersRepository
      .createQueryBuilder('m')
      .select('m.challenge_id', 'challenge_id')
      .addSelect('COUNT(*)::int', 'count')
      .where('m.challenge_id IN (:...challengeIds)', { challengeIds })
      .andWhere('m.status = :status', { status: 'active' })
      .groupBy('m.challenge_id')
      .getRawMany();

    return counts.reduce((acc, row) => {
      acc[row.challenge_id] = row.count;
      return acc;
    }, {} as Record<string, number>);
  }
}
