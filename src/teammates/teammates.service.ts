import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TeammateRequest } from './entities/teammate-request.entity';
import { Teammate } from './entities/teammate.entity';
import { TeammateRequestStatus } from './entities/teammate-request.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { User } from '../users/user.entity';
import { RequestType } from './dto/teammate-requests-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class TeammatesService {
  constructor(
    @InjectRepository(TeammateRequest)
    private readonly requestsRepository: Repository<TeammateRequest>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new ForbiddenException('Cannot send request to yourself');
    }

    const addressee = await this.usersRepository.findOne({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.requestsRepository.findOne({
      where: [
        { requester_id: requesterId, addressee_id: addresseeId },
        { requester_id: addresseeId, addressee_id: requesterId },
      ],
    });
    if (existing && existing.status === TeammateRequestStatus.PENDING) {
      throw new ConflictException('A pending request already exists');
    }

    const alreadyTeammates = await this.areTeammates(requesterId, addresseeId);
    if (alreadyTeammates) {
      throw new ConflictException('Already teammates');
    }

    const request = this.requestsRepository.create({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: TeammateRequestStatus.PENDING,
    });
    const saved = await this.requestsRepository.save(request);

    await this.notificationsService.create({
      userId: addresseeId,
      type: NotificationType.TEAMMATE_REQUEST,
      actorId: requesterId,
      subjectType: 'teammate_request',
      subjectId: saved.id,
    });

    return saved;
  }

  async respond(
    userId: string,
    requestId: string,
    status: TeammateRequestStatus,
  ) {
    const request = await this.requestsRepository.findOne({
      where: { id: requestId },
      relations: ['requester', 'addressee'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.addressee_id !== userId) {
      throw new ForbiddenException('Only the addressee can respond');
    }

    if (request.status !== TeammateRequestStatus.PENDING) {
      throw new ConflictException('Request already responded');
    }

    const validStatuses = [
      TeammateRequestStatus.ACCEPTED,
      TeammateRequestStatus.DECLINED,
      TeammateRequestStatus.CANCELED,
    ];
    if (!validStatuses.includes(status)) {
      throw new ConflictException('Status must be accepted, declined, or canceled');
    }

    request.status = status;
    request.responded_at = new Date();
    await this.requestsRepository.save(request);

    if (status === TeammateRequestStatus.ACCEPTED) {
      await this.createTeammatePair(request.requester_id, request.addressee_id);
    }

    await this.notificationsService.deleteBySubject(
      'teammate_request',
      requestId,
    );

    return request;
  }

  private async createTeammatePair(userId1: string, userId2: string) {
    const pairs = [
      { user_id: userId1, teammate_id: userId2 },
      { user_id: userId2, teammate_id: userId1 },
    ];
    for (const p of pairs) {
      const existing = await this.teammatesRepository.findOne({
        where: { user_id: p.user_id, teammate_id: p.teammate_id },
      });
      if (!existing) {
        await this.teammatesRepository.save(
          this.teammatesRepository.create(p),
        );
      }
    }
  }

  private async areTeammates(userId1: string, userId2: string): Promise<boolean> {
    const found = await this.teammatesRepository.findOne({
      where: { user_id: userId1, teammate_id: userId2 },
    });
    return !!found;
  }

  async getRequests(
    userId: string,
    type: RequestType,
    page: number,
    limit: number,
  ) {
    const where =
      type === RequestType.INCOMING
        ? { addressee_id: userId, status: TeammateRequestStatus.PENDING }
        : { requester_id: userId, status: TeammateRequestStatus.PENDING };

    const [items, total] = await this.requestsRepository.findAndCount({
      where,
      relations: type === RequestType.INCOMING ? ['requester'] : ['addressee'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const otherUser = type === RequestType.INCOMING ? 'requester' : 'addressee';

    return {
      items: items.map((r) => ({
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        user: (r as any)[otherUser]
          ? {
              id: (r as any)[otherUser].id,
              firstName: (r as any)[otherUser].firstName,
              lastName: (r as any)[otherUser].lastName,
              picture: (r as any)[otherUser].picture,
              email: (r as any)[otherUser].email,
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  async getTeammatesCount(userId: string): Promise<number> {
    return this.teammatesRepository.count({
      where: { user_id: userId },
    });
  }

  async getTeammates(userId: string, page: number, limit: number) {
    const [items, total] = await this.teammatesRepository.findAndCount({
      where: { user_id: userId },
      relations: ['teammate'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((t) => ({
        id: t.teammate_id,
        firstName: t.teammate?.firstName,
        lastName: t.teammate?.lastName,
        picture: t.teammate?.picture,
        email: t.teammate?.email,
        created_at: t.created_at,
      })),
      total,
      page,
      limit,
    };
  }

  async getSuggestions(
    userId: string,
    search: string | undefined,
    page: number,
    limit: number,
  ) {
    const myChallengeIds = await this.membersRepository
      .createQueryBuilder('m')
      .select('m.challenge_id')
      .where('m.user_id = :userId', { userId })
      .andWhere('m.status = :status', { status: 'active' })
      .getRawMany();
    const challengeIds = myChallengeIds.map((r) => r.m_challenge_id);

    const teammateIds = await this.teammatesRepository
      .createQueryBuilder('t')
      .select('t.teammate_id')
      .where('t.user_id = :userId', { userId })
      .getRawMany();
    const excludeTeammateIds = teammateIds.map((r) => r.t_teammate_id);

    const pendingRequestUserIds = await this.requestsRepository
      .createQueryBuilder('r')
      .select(['r.requester_id', 'r.addressee_id'])
      .where('r.status = :status', { status: TeammateRequestStatus.PENDING })
      .andWhere('(r.requester_id = :userId OR r.addressee_id = :userId)', {
        userId,
      })
      .getRawMany();
    const excludeRequestIds = new Set<string>();
    for (const r of pendingRequestUserIds) {
      const other =
        r.r_requester_id === userId ? r.r_addressee_id : r.r_requester_id;
      excludeRequestIds.add(other);
    }

    const excludeIds = [
      userId,
      ...excludeTeammateIds,
      ...Array.from(excludeRequestIds),
    ];

    let qb = this.usersRepository
      .createQueryBuilder('u')
      .innerJoin(
        'challenge_members',
        'cm_any',
        'cm_any.user_id = u.id AND cm_any.status = :status',
        { status: 'active' },
      )
      .where('u.id NOT IN (:...excludeIds)', { excludeIds })
      .groupBy('u.id');

    if (challengeIds.length > 0) {
      qb = qb
        .leftJoin(
          'challenge_members',
          'cm_mine',
          'cm_mine.user_id = u.id AND cm_mine.challenge_id IN (:...challengeIds) AND cm_mine.status = :status',
          { challengeIds, status: 'active' },
        )
        .addOrderBy('COUNT(cm_mine.challenge_id)', 'DESC');
    } else {
      qb = qb.addOrderBy('u.created_at', 'DESC');
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      qb = qb.andWhere(
        '(u.firstName ILIKE :term OR u.lastName ILIKE :term)',
        { term },
      );
    }

    const countQb = qb.clone();
    const total = await countQb.getCount();

    const userIds = await qb
      .select('u.id', 'id')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    if (userIds.length === 0) {
      return { items: [], total, page, limit };
    }

    const ids = userIds.map((r) => r.id);
    const users = await this.usersRepository.find({
      where: { id: In(ids) },
    });

    const commonChallengesMap: Record<string, string[]> = {};
    if (challengeIds.length > 0) {
      for (const uid of ids) {
        const common = await this.membersRepository
          .createQueryBuilder('m')
          .select('m.challenge_id')
          .where('m.user_id = :uid', { uid })
          .andWhere('m.challenge_id IN (:...challengeIds)', { challengeIds })
          .getRawMany();
        commonChallengesMap[uid] = common.map((c) => c.m_challenge_id);
      }
    }

    const challengeDetails =
      challengeIds.length > 0
        ? await this.challengesRepository.find({
            where: { id: In([...challengeIds]) },
          })
        : [];
    const challengeMap = new Map(challengeDetails.map((c) => [c.id, c]));

    const items = users.map((u) => {
      const commonIds = commonChallengesMap[u.id] || [];
      const commonChallenges = commonIds.map((id) => {
        const c = challengeMap.get(id);
        return c ? { id: c.id, title: c.title } : null;
      }).filter(Boolean);

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        picture: u.picture,
        email: u.email,
        commonChallenges,
      };
    });

    return { items, total, page, limit };
  }
}
