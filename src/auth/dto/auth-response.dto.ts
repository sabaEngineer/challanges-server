import { ApiProperty } from '@nestjs/swagger';

export class BadgeDto {
  @ApiProperty({ example: 2 })
  level: number;

  @ApiProperty({ example: 'Warrior' })
  name: string;
}

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  firstName: string;

  @ApiProperty({ nullable: true })
  lastName: string;

  @ApiProperty({ nullable: true })
  picture: string;

  @ApiProperty({
    description: 'Total successful check-ins across all challenges',
    example: 42,
  })
  total_checkins: number;

  @ApiProperty({
    description: 'Badge tier based on total_checkins (null if < 10)',
    type: BadgeDto,
    nullable: true,
  })
  badge: BadgeDto | null;

  @ApiProperty({
    description:
      'When true, skip "build your team" flow and go directly to join pack',
  })
  skip_build_team: boolean;

  @ApiProperty({
    description: 'User role: user (default) or admin',
    enum: ['user', 'admin'],
  })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: AuthUserDto;
}
