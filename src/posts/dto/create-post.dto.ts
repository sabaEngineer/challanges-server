import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
  ArrayMaxSize,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostShareType } from '../entities/post.entity';
import { PostMediaType } from '../entities/post-media.entity';

export class PostMediaItemDto {
  @ApiProperty({ enum: PostMediaType })
  @IsEnum(PostMediaType)
  type: PostMediaType;

  @ApiProperty({ description: 'CloudFront URL' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'S3 storage key' })
  @IsOptional()
  @IsString()
  storage_key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size_bytes?: number;

  @ApiPropertyOptional({ description: 'Image/video width' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  width?: number;

  @ApiPropertyOptional({ description: 'Image/video height' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  height?: number;

  @ApiPropertyOptional({ description: 'Video duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration_seconds?: number;
}

export class CreatePostDto {
  @ApiPropertyOptional({ description: 'Challenge ID (if post is challenge-linked)' })
  @IsOptional()
  @IsString()
  challenge_id?: string;

  @ApiPropertyOptional({
    description:
      'Check-in ID (if post is from check-in; requires challenge_id)',
  })
  @IsOptional()
  @IsString()
  checkin_id?: string;

  @ApiProperty({
    enum: PostShareType,
    description:
      'win, learned, advice, motivate, moment, lesson, next_time, honesty, support, general',
  })
  @IsEnum(PostShareType)
  share_type: PostShareType;

  @ApiPropertyOptional({ description: 'Post text (max 500 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @ApiPropertyOptional({
    type: [PostMediaItemDto],
    description: 'Media items (max 5)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaItemDto)
  @ArrayMaxSize(5)
  media?: PostMediaItemDto[];
}
