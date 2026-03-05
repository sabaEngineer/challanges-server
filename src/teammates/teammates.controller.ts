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
import { TeammatesService } from './teammates.service';
import { SendTeammateRequestDto } from './dto/send-request.dto';
import { RespondTeammateRequestDto } from './dto/respond-request.dto';
import {
  TeammateRequestsQueryDto,
  RequestType,
} from './dto/teammate-requests-query.dto';
import { TeammateSuggestionsQueryDto } from './dto/suggestions-query.dto';
import { UpdateFavoriteDto } from './dto/update-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';
@ApiTags('Teammates')
@Controller('teammates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeammatesController {
  constructor(private readonly teammatesService: TeammatesService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Send team up request to another user' })
  @ApiResponse({ status: 201, description: 'Request sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already teammates or pending request exists' })
  async sendRequest(
    @CurrentUser() user: User,
    @Body() dto: SendTeammateRequestDto,
  ) {
    return this.teammatesService.sendRequest(user.id, dto.addressee_id);
  }

  @Patch('requests/:id/respond')
  @ApiOperation({ summary: 'Respond to a team up request (accept/decline/cancel)' })
  @ApiResponse({ status: 200, description: 'Request responded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only addressee can respond' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 409, description: 'Request already responded' })
  async respond(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondTeammateRequestDto,
  ) {
    return this.teammatesService.respond(user.id, id, dto.status);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Fetch teammate requests (incoming or outgoing)' })
  @ApiResponse({ status: 200, description: 'Paginated list of requests' })
  async getRequests(
    @CurrentUser() user: User,
    @Query() query: TeammateRequestsQueryDto,
  ) {
    return this.teammatesService.getRequests(
      user.id,
      query.type ?? RequestType.INCOMING,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('count')
  @ApiOperation({ summary: 'Get number of teammates' })
  @ApiResponse({ status: 200, description: 'Teammate count' })
  async getCount(@CurrentUser() user: User) {
    const count = await this.teammatesService.getTeammatesCount(user.id);
    return { count };
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Mark or unmark teammate as favorite' })
  @ApiResponse({ status: 200, description: 'Favorite status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teammate not found' })
  async updateFavorite(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFavoriteDto,
  ) {
    return this.teammatesService.updateFavorite(user.id, id, dto.is_favorite);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a teammate' })
  @ApiResponse({ status: 200, description: 'Teammate removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Teammate not found' })
  async removeTeammate(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.teammatesService.removeTeammate(user.id, id);
    return { success: true };
  }

  @Get()
  @ApiOperation({ summary: 'Get teammates list (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of teammates' })
  async getTeammates(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 20;
    return this.teammatesService.getTeammates(user.id, p, l);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get user suggestions for team up (same challenges, search by name)' })
  @ApiResponse({ status: 200, description: 'Paginated suggestions with common challenges' })
  async getSuggestions(
    @CurrentUser() user: User,
    @Query() query: TeammateSuggestionsQueryDto,
  ) {
    return this.teammatesService.getSuggestions(
      user.id,
      query.search,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
