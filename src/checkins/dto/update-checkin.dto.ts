import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CheckinStatus } from '../../challenges/entities/challenge-checkin.entity';
import { CheckinMediaItemDto } from './create-checkin.dto';

export class UpdateCheckinDto {
  @ApiPropertyOptional({ enum: CheckinStatus, description: 'success or failed' })
  @IsOptional()
  @IsEnum(CheckinStatus)
  status?: CheckinStatus;

  @ApiPropertyOptional({ description: 'Optional text note' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Replace media. Each item: { type: "image" | "video", url: string }',
    type: [CheckinMediaItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckinMediaItemDto)
  media?: CheckinMediaItemDto[];
}
