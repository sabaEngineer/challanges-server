import {
  Controller,
  Post,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DevService } from './dev.service';

const DEV_USER_EMAIL = 'sabapachulia123@gmail.com';

@ApiTags('Dev')
@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Post('reset-user-progress')
  @ApiOperation({
    summary: '[DEV ONLY] Reset progress for test user (teammates, check-ins)',
  })
  @ApiResponse({ status: 200, description: 'User progress reset' })
  @ApiResponse({ status: 403, description: 'Only available in development' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetUserProgress() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('This endpoint is disabled in production');
    }
    const result = await this.devService.resetUserProgress(DEV_USER_EMAIL);
    if (!result) {
      throw new NotFoundException(`User with email ${DEV_USER_EMAIL} not found`);
    }
    return result;
  }
}
