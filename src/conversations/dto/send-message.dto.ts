import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @ApiPropertyOptional({
    description:
      'Client temp ID for optimistic updates. Echoed in response so client can match and replace.',
  })
  @IsOptional()
  @IsString()
  client_temp_id?: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({ description: 'Message text (for text type)' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Image URL (for image type)' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'S3 storage key (for image type)' })
  @IsOptional()
  @IsString()
  image_storage_key?: string;

  @ApiPropertyOptional({ description: 'Image MIME type' })
  @IsOptional()
  @IsString()
  image_mime_type?: string;

  @ApiPropertyOptional({ description: 'Image size in bytes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  image_size_bytes?: number;

  @ApiPropertyOptional({ description: 'Image width' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  image_width?: number;

  @ApiPropertyOptional({ description: 'Image height' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  image_height?: number;

  @ApiPropertyOptional({ description: 'Video URL (for video type)' })
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiPropertyOptional({ description: 'S3 storage key (for video type)' })
  @IsOptional()
  @IsString()
  video_storage_key?: string;

  @ApiPropertyOptional({ description: 'Video MIME type (e.g. video/mp4)' })
  @IsOptional()
  @IsString()
  video_mime_type?: string;

  @ApiPropertyOptional({ description: 'Video size in bytes' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  video_size_bytes?: number;

  @ApiPropertyOptional({ description: 'Video duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  video_duration_seconds?: number;
}
