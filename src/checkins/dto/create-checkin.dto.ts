import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckinStatus } from '../../challenges/entities/challenge-checkin.entity';
import { PostMediaType } from '../../challenges/entities/checkin-media.entity';

export class CheckinMediaItemDto {
  @ApiProperty({ enum: PostMediaType })
  @IsEnum(PostMediaType)
  type: PostMediaType;

  @ApiProperty({ description: 'URL of the uploaded image or video' })
  @IsString()
  url: string;
}

export class CreateCheckinDto {
  @ApiPropertyOptional({
    description: 'Date of the check-in (YYYY-MM-DD). Defaults to today.',
    example: '2026-03-15',
  })
  @IsOptional()
  @IsDateString()
  checkin_date?: string;

  @ApiProperty({ enum: CheckinStatus, description: 'success or failed' })
  @IsEnum(CheckinStatus)
  status: CheckinStatus;

  @ApiPropertyOptional({ description: 'Optional text note' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Optional media (images/videos) attached to the check-in',
    type: [CheckinMediaItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckinMediaItemDto)
  media?: CheckinMediaItemDto[];
}
