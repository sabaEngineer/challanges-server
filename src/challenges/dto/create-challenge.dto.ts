import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChallengeVisibility,
  ChallengeType,
  CheckinMediaRequirement,
} from '../entities/challenge.entity';

export class CreateChallengeDto {
  @ApiProperty({ description: 'Challenge title', example: '30 Days of Meditation' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Challenge description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Challenge image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ enum: ChallengeVisibility, default: ChallengeVisibility.PUBLIC })
  @IsEnum(ChallengeVisibility)
  visibility: ChallengeVisibility;

  @ApiProperty({ enum: ChallengeType, example: ChallengeType.STRICT })
  @IsEnum(ChallengeType)
  type: ChallengeType;

  @ApiProperty({ enum: CheckinMediaRequirement, default: CheckinMediaRequirement.NONE })
  @IsEnum(CheckinMediaRequirement)
  media_requirement: CheckinMediaRequirement;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2026-03-01' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
