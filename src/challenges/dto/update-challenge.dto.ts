import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChallengeVisibility,
  CheckinMediaRequirement,
} from '../entities/challenge.entity';

export class UpdateChallengeDto {
  @ApiPropertyOptional({ description: 'Challenge title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Challenge description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Challenge image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: ChallengeVisibility })
  @IsOptional()
  @IsEnum(ChallengeVisibility)
  visibility?: ChallengeVisibility;

  @ApiPropertyOptional({ enum: CheckinMediaRequirement })
  @IsOptional()
  @IsEnum(CheckinMediaRequirement)
  media_requirement?: CheckinMediaRequirement;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'System advice/tips for users (admin only). Shown when user asks for help.',
  })
  @IsOptional()
  @IsString()
  system_advice?: string;
}
