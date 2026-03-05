import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeVisibility } from './entities/challenge.entity';
import { ChallengeInvite } from './entities/challenge-invite.entity';
import { ChallengeInviteStatus } from './entities/challenge-invite.entity';
import { ChallengeMember } from './entities/challenge-member.entity';
import { ChallengeCheckin } from './entities/challenge-checkin.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { MembersSortBy } from './dto/challenge-members-query.dto';
import { formatUserForResponse } from '../users/badge';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(ChallengeCheckin)
    private readonly checkinsRepository: Repository<ChallengeCheckin>,
    @InjectRepository(ChallengeInvite)
    private readonly invitesRepository: Repository<ChallengeInvite>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
    private readonly postsService: PostsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(user: User, dto: CreateChallengeDto): Promise<Challenge> {
    const { system_advice, ...rest } = dto;
    const challengeData: Record<string, unknown> = {
      ...rest,
      created_by: user.id,
    };
    if (user.role === UserRole.ADMIN && system_advice != null) {
      challengeData.system_advice = system_advice;
    }
    const challenge = this.challengesRepository.create(challengeData);

    const saved = await this.challengesRepository.save(challenge);

    const member = this.membersRepository.create({
      challenge_id: saved.id,
      user_id: user.id,
      status: 'active',
    });
    await this.membersRepository.save(member);

    if (
      saved.visibility === ChallengeVisibility.PUBLIC ||
      saved.visibility === ChallengeVisibility.TEAMMATES_ONLY
    ) {
      await this.postsService.createChallengeCreatedPost(
        user.id,
        saved.id,
        saved.title,
      );

      const teammateRows = await this.teammatesRepository.find({
        where: [
          { user_id: user.id },
          { teammate_id: user.id },
        ],
      });
      const teammateIds = new Set<string>();
      for (const t of teammateRows) {
        const other = t.user_id === user.id ? t.teammate_id : t.user_id;
        if (other !== user.id) teammateIds.add(other);
      }
      for (const teammateId of teammateIds) {
        await this.notificationsService.create({
          userId: teammateId,
          type: NotificationType.CHALLENGE_CREATED,
          actorId: user.id,
          subjectType: 'challenge',
          subjectId: saved.id,
          payload: { challenge_title: saved.title },
        });
      }
    }

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
    user: User,
    challengeId: string,
    dto: UpdateChallengeDto,
  ): Promise<Challenge> {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const isCreator = challenge.created_by === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Only the creator or an admin can update this challenge');
    }

    const { system_advice, ...rest } = dto;
    Object.assign(challenge, rest);

    if (system_advice !== undefined) {
      if (isAdmin) {
        challenge.system_advice = system_advice;
      }
    }

    return this.challengesRepository.save(challenge);
  }

  async join(userId: string, challengeId: string) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.visibility === ChallengeVisibility.PRIVATE_INVITE) {
      const invite = await this.invitesRepository.findOne({
        where: { challenge_id: challengeId, user_id: userId },
      });
      if (!invite || invite.status !== ChallengeInviteStatus.PENDING) {
        throw new ForbiddenException('You must be invited to join this challenge');
      }
    }

    const existing = await this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId },
    });

    if (existing && existing.status === 'active') {
      throw new ConflictException('Already a member of this challenge');
    }

    if (existing) {
      existing.status = 'active';
      await this.membersRepository.save(existing);
    } else {
      const member = this.membersRepository.create({
        challenge_id: challengeId,
        user_id: userId,
        status: 'active',
      });
      await this.membersRepository.save(member);
    }

    const invite = await this.invitesRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, status: ChallengeInviteStatus.PENDING },
    });
    if (invite) {
      invite.status = ChallengeInviteStatus.ACCEPTED;
      await this.invitesRepository.save(invite);
    }

    return this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId },
    });
  }

  async inviteTeammates(userId: string, challengeId: string, userIds: string[]) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.visibility === ChallengeVisibility.PRIVATE_INVITE) {
      if (challenge.created_by !== userId) {
        throw new ForbiddenException('Only the creator can invite teammates to private invite challenges');
      }
    } else {
      const isMember = await this.membersRepository.findOne({
        where: { challenge_id: challengeId, user_id: userId, status: 'active' },
      });
      if (!isMember) {
        throw new ForbiddenException('You must be a member of this challenge to invite teammates');
      }
    }

    const isTeammate = async (inviterId: string, targetId: string) => {
      const t = await this.teammatesRepository.findOne({
        where: [
          { user_id: inviterId, teammate_id: targetId },
          { user_id: targetId, teammate_id: inviterId },
        ],
      });
      return !!t;
    };

    const created: { user_id: string }[] = [];

    for (const targetId of userIds) {
      if (targetId === userId) continue;
      if (!(await isTeammate(userId, targetId))) {
        throw new ForbiddenException(`User ${targetId} is not your teammate`);
      }

      const existingMember = await this.membersRepository.findOne({
        where: { challenge_id: challengeId, user_id: targetId, status: 'active' },
      });
      if (existingMember) continue;

      let invite = await this.invitesRepository.findOne({
        where: { challenge_id: challengeId, user_id: targetId },
      });
      if (!invite) {
        invite = this.invitesRepository.create({
          challenge_id: challengeId,
          user_id: targetId,
          invited_by: userId,
          status: ChallengeInviteStatus.PENDING,
        });
        await this.invitesRepository.save(invite);
        created.push({ user_id: targetId });

        await this.notificationsService.create({
          userId: targetId,
          type: NotificationType.CHALLENGE_INVITE,
          actorId: userId,
          subjectType: 'challenge',
          subjectId: challengeId,
          payload: { challenge_title: challenge.title },
        });
      }
    }

    return { invited: created.length, user_ids: created.map((c) => c.user_id) };
  }

  async getMyInvites(userId: string) {
    const invites = await this.invitesRepository.find({
      where: { user_id: userId, status: ChallengeInviteStatus.PENDING },
      relations: ['challenge', 'challenge.creator', 'inviter'],
      order: { created_at: 'DESC' },
    });

    const challengeIds = invites.map((i) => i.challenge_id);
    const memberCounts = challengeIds.length > 0 ? await this.getMemberCounts(challengeIds) : {};

    return invites.map((inv) => ({
      id: inv.id,
      challenge_id: inv.challenge_id,
      challenge: inv.challenge
        ? {
            ...inv.challenge,
            creator: inv.challenge.creator ? formatUserForResponse(inv.challenge.creator) : null,
            member_count: memberCounts[inv.challenge_id] || 0,
          }
        : null,
      inviter: inv.inviter ? formatUserForResponse(inv.inviter) : null,
      created_at: inv.created_at,
    }));
  }

  async declineInvite(userId: string, challengeId: string) {
    const invite = await this.invitesRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, status: ChallengeInviteStatus.PENDING },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found or already responded');
    }

    invite.status = ChallengeInviteStatus.DECLINED;
    await this.invitesRepository.save(invite);
    return { success: true };
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
      creator: m.challenge.creator ? formatUserForResponse(m.challenge.creator) : null,
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
      creator: c.creator ? formatUserForResponse(c.creator) : null,
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
    userId: string,
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

    if (challenge.visibility === ChallengeVisibility.PRIVATE_INVITE) {
      const isCreator = challenge.created_by === userId;
      const isMember = await this.membersRepository.findOne({
        where: { challenge_id: challengeId, user_id: userId, status: 'active' },
      });
      if (!isCreator && !isMember) {
        throw new ForbiddenException('You do not have access to this challenge');
      }
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

  async findById(challengeId: string, userId: string) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
      relations: ['creator'],
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.visibility === ChallengeVisibility.PRIVATE_INVITE) {
      const isCreator = challenge.created_by === userId;
      const isMember = await this.membersRepository.findOne({
        where: { challenge_id: challengeId, user_id: userId, status: 'active' },
      });
      const hasInvite = await this.invitesRepository.findOne({
        where: { challenge_id: challengeId, user_id: userId, status: ChallengeInviteStatus.PENDING },
      });
      if (!isCreator && !isMember && !hasInvite) {
        throw new ForbiddenException('You do not have access to this challenge');
      }
    }

    const memberCounts = await this.getMemberCounts([challengeId]);

    return {
      ...challenge,
      creator: challenge.creator ? formatUserForResponse(challenge.creator) : null,
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
