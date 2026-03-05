import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFavoriteDto {
  @ApiProperty({ description: 'Whether to mark as favorite' })
  @IsBoolean()
  is_favorite: boolean;
}
