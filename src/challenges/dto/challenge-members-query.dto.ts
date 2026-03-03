import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MembersSortBy {
  BEST_STREAK = 'best_streak',
  CURRENT_STREAK = 'current_streak',
  JOINED_AT = 'joined_at',
}

export class ChallengeMembersQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: MembersSortBy, default: MembersSortBy.BEST_STREAK })
  @IsOptional()
  @IsEnum(MembersSortBy)
  sortBy?: MembersSortBy = MembersSortBy.BEST_STREAK;
}
