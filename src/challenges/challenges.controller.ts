import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ExploreChallengesDto } from './dto/explore-challenges.dto';
import {
  ChallengeMembersQueryDto,
  MembersSortBy,
} from './dto/challenge-members-query.dto';
import { ChallengeCheckinsQueryDto } from './dto/challenge-checkins-query.dto';
import { CreateCheckinDto } from '../checkins/dto/create-checkin.dto';
import { UpdateCheckinDto } from '../checkins/dto/update-checkin.dto';
import { CheckinsService } from '../checkins/checkins.service';
import { PostsService } from '../posts/posts.service';
import { PostsQueryDto } from '../posts/dto/posts-query.dto';
import { InviteTeammatesDto } from './dto/invite-teammates.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Challenges')
@Controller('challenges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly checkinsService: CheckinsService,
    private readonly postsService: PostsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateChallengeDto,
  ) {
    return this.challengesService.create(user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a challenge (creator only)' })
  @ApiResponse({ status: 200, description: 'Challenge deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the creator can delete' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async delete(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.challengesService.delete(user.id, id);
    return { success: true };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a challenge (creator only)' })
  @ApiResponse({ status: 200, description: 'Challenge updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the creator can update' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.challengesService.update(user, id, dto);
  }

  @Patch(':id/checkin')
  @ApiOperation({ summary: 'Update today\'s check-in for a challenge' })
  @ApiResponse({ status: 200, description: 'Check-in updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Must join challenge first' })
  @ApiResponse({ status: 404, description: 'Challenge not found or no check-in for today' })
  async updateCheckin(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCheckinDto,
  ) {
    return this.checkinsService.update(user.id, id, dto);
  }

  @Post(':id/checkin')
  @ApiOperation({ summary: 'Check in for a challenge (daily progress)' })
  @ApiResponse({ status: 201, description: 'Check-in recorded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Must join challenge first' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  @ApiResponse({ status: 409, description: 'Already checked in for this date' })
  async checkin(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCheckinDto,
  ) {
    return this.checkinsService.create(user.id, id, dto);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a challenge' })
  @ApiResponse({ status: 201, description: 'Successfully joined the challenge' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async join(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.challengesService.join(user.id, id);
  }

  @Get('explore')
  @ApiOperation({ summary: 'Browse public challenges sorted by popularity' })
  @ApiResponse({ status: 200, description: 'List of public challenges' })
  async explore(@Query() query: ExploreChallengesDto) {
    return this.challengesService.findPublic(query.page, query.limit);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all challenges the current user is a member of' })
  @ApiResponse({ status: 200, description: 'List of user challenges' })
  async getMyChallenges(@CurrentUser() user: User) {
    return this.challengesService.findByUser(user.id);
  }

  @Get('invites')
  @ApiOperation({ summary: 'List pending challenge invites for the current user' })
  @ApiResponse({ status: 200, description: 'List of pending invites' })
  async getMyInvites(@CurrentUser() user: User) {
    return this.challengesService.getMyInvites(user.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite teammates to a private invite challenge (creator only)' })
  @ApiResponse({ status: 201, description: 'Invites sent' })
  @ApiResponse({ status: 403, description: 'Only creator can invite' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async inviteTeammates(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InviteTeammatesDto,
  ) {
    return this.challengesService.inviteTeammates(user.id, id, dto.user_ids);
  }

  @Patch(':id/invite/decline')
  @ApiOperation({ summary: 'Decline a challenge invite' })
  @ApiResponse({ status: 200, description: 'Invite declined' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async declineInvite(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.challengesService.declineInvite(user.id, id);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get challenge posts (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of posts' })
  @ApiResponse({ status: 403, description: 'No access to this challenge' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallengePosts(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PostsQueryDto,
  ) {
    return this.postsService.getByChallenge(
      user.id,
      id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id/checkins')
  @ApiOperation({ summary: 'Get challenge check-ins (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of check-ins' })
  @ApiResponse({ status: 403, description: 'No access to this challenge' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getCheckins(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ChallengeCheckinsQueryDto,
  ) {
    return this.challengesService.findCheckins(
      user.id,
      id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get challenge members with streaks (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of members' })
  @ApiResponse({ status: 403, description: 'No access to this challenge' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getMembers(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ChallengeMembersQueryDto,
  ) {
    return this.challengesService.findMembers(
      user.id,
      id,
      query.page,
      query.limit,
      query.sortBy ?? MembersSortBy.BEST_STREAK,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a challenge by ID' })
  @ApiResponse({ status: 200, description: 'Challenge details' })
  @ApiResponse({ status: 403, description: 'No access to this challenge' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.challengesService.findById(id, user.id);
  }
}
