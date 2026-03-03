import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PostsQueryDto } from '../posts/dto/posts-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Get('me/posts')
  @ApiOperation({ summary: "Get current user's recent posts" })
  @ApiResponse({ status: 200, description: 'Paginated list of own recent posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPosts(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Math.min(Math.max(1, Number(limit)), 50) : 20;
    return this.usersService.getMyRecentPosts(user.id, p, l);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: "Get user's posts (visibility: public challenges + teammates-only when teammate, standalone only for teammates)" })
  @ApiResponse({ status: 200, description: 'Paginated list of posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPosts(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PostsQueryDto,
  ) {
    return this.postsService.getByUser(
      user.id,
      id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id/challenges')
  @ApiOperation({ summary: "Get user's challenges (visible to requester)" })
  @ApiResponse({ status: 200, description: 'Paginated list of challenges' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getChallenges(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    return this.usersService.getUserChallenges(user.id, id, p, l);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID (public profile)',
    description:
      'Returns user profile and recent posts. Posts are filtered: only from challenges the requester can see (public or teammates-only when teammate), or standalone for teammates.',
  })
  @ApiResponse({ status: 200, description: 'User public profile with recent posts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getById(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('recent_posts_limit') recentPostsLimit?: number,
  ) {
    const limit = recentPostsLimit ? Number(recentPostsLimit) : 10;
    return this.usersService.getPublicProfile(user.id, id, limit);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.updateUser(user, dto);
    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      picture: updated.picture,
      pushToken: updated.pushToken,
      skip_build_team: updated.skip_build_team,
    };
  }
}
