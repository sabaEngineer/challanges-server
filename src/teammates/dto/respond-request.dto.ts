import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeammateRequestStatus } from '../entities/teammate-request.entity';

export class RespondTeammateRequestDto {
  @ApiProperty({ enum: TeammateRequestStatus, description: 'Response: accepted, declined, or canceled' })
  @IsEnum(TeammateRequestStatus)
  status: TeammateRequestStatus;

  // Note: Only accepted, declined, canceled are valid for respond - validated in service
}
