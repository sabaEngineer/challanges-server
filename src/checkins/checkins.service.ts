import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeCheckin } from '../challenges/entities/challenge-checkin.entity';
import { CheckinMedia } from '../challenges/entities/checkin-media.entity';
import { ChallengeMember } from '../challenges/entities/challenge-member.entity';
import { Challenge } from '../challenges/entities/challenge.entity';
import { Teammate } from '../teammates/entities/teammate.entity';
import { User } from '../users/user.entity';
import { CheckinStatus } from '../challenges/entities/challenge-checkin.entity';
import { PostMediaType } from '../challenges/entities/checkin-media.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { getBadge } from '../users/badge';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(ChallengeCheckin)
    private readonly checkinsRepository: Repository<ChallengeCheckin>,
    @InjectRepository(CheckinMedia)
    private readonly mediaRepository: Repository<CheckinMedia>,
    @InjectRepository(ChallengeMember)
    private readonly membersRepository: Repository<ChallengeMember>,
    @InjectRepository(Challenge)
    private readonly challengesRepository: Repository<Challenge>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Teammate)
    private readonly teammatesRepository: Repository<Teammate>,
    private readonly postsService: PostsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, challengeId: string, dto: CreateCheckinDto) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const member = await this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new ForbiddenException('You must join the challenge first');
    }

    const checkinDate = dto.checkin_date || this.getTodayDate();

    const existing = await this.checkinsRepository.findOne({
      where: { member_id: member.id, checkin_date: checkinDate },
    });

    if (existing) {
      throw new ConflictException(
        'You already checked in for this date. One check-in per day allowed.',
      );
    }

    const checkin = this.checkinsRepository.create({
      challenge_id: challengeId,
      user_id: userId,
      member_id: member.id,
      checkin_date: checkinDate,
      status: dto.status,
      text: dto.text,
    });

    const saved = await this.checkinsRepository.save(checkin);

    if (dto.media?.length) {
      const mediaItems = dto.media.map((m) =>
        this.mediaRepository.create({
          checkin_id: saved.id,
          type: m.type as PostMediaType,
          url: m.url,
        }),
      );
      await this.mediaRepository.save(mediaItems);
    }

    await this.updateStreak(member, dto.status, checkinDate);

    if (dto.status === CheckinStatus.SUCCESS) {
      const userBefore = await this.usersRepository.findOne({
        where: { id: userId },
        select: ['total_checkins'],
      });
      const badgeBefore = getBadge(userBefore?.total_checkins ?? 0);
      await this.usersRepository.increment({ id: userId }, 'total_checkins', 1);
      const userAfter = await this.usersRepository.findOne({
        where: { id: userId },
        select: ['total_checkins'],
      });
      const badgeAfter = getBadge(userAfter?.total_checkins ?? 0);
      if (badgeAfter && (!badgeBefore || badgeAfter.level > badgeBefore.level)) {
        await this.onBadgeEarned(userId, challengeId, saved.id, badgeAfter.name);
      }
    }

    return this.checkinsRepository.findOne({
      where: { id: saved.id },
      relations: ['media'],
    });
  }

  async update(userId: string, challengeId: string, dto: UpdateCheckinDto) {
    const challenge = await this.challengesRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const member = await this.membersRepository.findOne({
      where: { challenge_id: challengeId, user_id: userId, status: 'active' },
    });

    if (!member) {
      throw new ForbiddenException('You must join the challenge first');
    }

    const today = this.getTodayDate();
    const checkin = await this.checkinsRepository.findOne({
      where: { member_id: member.id, checkin_date: today },
      relations: ['media'],
    });

    if (!checkin) {
      throw new NotFoundException('No check-in found for today');
    }

    const previousStatus = checkin.status;

    if (dto.status !== undefined) {
      checkin.status = dto.status;
    }
    if (dto.text !== undefined) {
      checkin.text = dto.text;
    }

    await this.checkinsRepository.save(checkin);

    if (dto.media !== undefined) {
      await this.mediaRepository.delete({ checkin_id: checkin.id });
      if (dto.media.length > 0) {
        const mediaItems = dto.media.map((m) =>
          this.mediaRepository.create({
            checkin_id: checkin.id,
            type: m.type as PostMediaType,
            url: m.url,
          }),
        );
        await this.mediaRepository.save(mediaItems);
      }
    }

    if (dto.status !== undefined && dto.status !== previousStatus) {
      await this.updateStreak(member, dto.status, today);
      if (previousStatus === CheckinStatus.SUCCESS && dto.status === CheckinStatus.FAILED) {
        await this.usersRepository.decrement({ id: userId }, 'total_checkins', 1);
      } else if (previousStatus === CheckinStatus.FAILED && dto.status === CheckinStatus.SUCCESS) {
        const userBefore = await this.usersRepository.findOne({
          where: { id: userId },
          select: ['total_checkins'],
        });
        const badgeBefore = getBadge(userBefore?.total_checkins ?? 0);
        await this.usersRepository.increment({ id: userId }, 'total_checkins', 1);
        const userAfter = await this.usersRepository.findOne({
          where: { id: userId },
          select: ['total_checkins'],
        });
        const badgeAfter = getBadge(userAfter?.total_checkins ?? 0);
        if (badgeAfter && (!badgeBefore || badgeAfter.level > badgeBefore.level)) {
          await this.onBadgeEarned(userId, challengeId, checkin.id, badgeAfter.name);
        }
      }
    }

    return this.checkinsRepository.findOne({
      where: { id: checkin.id },
      relations: ['media'],
    });
  }

  private async onBadgeEarned(
    userId: string,
    challengeId: string,
    checkinId: string,
    badgeName: string,
  ): Promise<void> {
    const post = await this.postsService.createBadgeEarnedPost(
      userId,
      challengeId,
      checkinId,
      badgeName,
    );

    const teammateRows = await this.teammatesRepository.find({
      where: [
        { user_id: userId },
        { teammate_id: userId },
      ],
    });
    const teammateIds = new Set<string>();
    for (const t of teammateRows) {
      const other = t.user_id === userId ? t.teammate_id : t.user_id;
      if (other !== userId) teammateIds.add(other);
    }
    for (const teammateId of teammateIds) {
      await this.notificationsService.create({
        userId: teammateId,
        type: NotificationType.BADGE_EARNED,
        actorId: userId,
        subjectType: 'post',
        subjectId: post.id,
        payload: { badge_name: badgeName },
      });
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async updateStreak(
    member: ChallengeMember,
    status: CheckinStatus,
    checkinDate: string,
  ) {
    if (status === CheckinStatus.FAILED) {
      member.current_streak = 0;
      await this.membersRepository.save(member);
      return;
    }

    const yesterday = this.getYesterday(checkinDate);
    const yesterdayCheckin = await this.checkinsRepository.findOne({
      where: { member_id: member.id, checkin_date: yesterday },
    });

    const newStreak =
      yesterdayCheckin?.status === CheckinStatus.SUCCESS
        ? member.current_streak + 1
        : 1;

    member.current_streak = newStreak;
    member.best_streak = Math.max(member.best_streak, newStreak);
    await this.membersRepository.save(member);
  }

  private getYesterday(dateStr: string): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
}
