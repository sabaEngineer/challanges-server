import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  picture?: string;

  @ApiPropertyOptional({ description: 'Push notification token' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pushToken?: string;

  @ApiPropertyOptional({
    description:
      'When true, skip "build your team" flow and go directly to join pack (for returning users)',
  })
  @IsOptional()
  @IsBoolean()
  skip_build_team?: boolean;
}
