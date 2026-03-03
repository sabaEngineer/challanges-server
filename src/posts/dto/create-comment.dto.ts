import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text (required, 1-500 chars)' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
