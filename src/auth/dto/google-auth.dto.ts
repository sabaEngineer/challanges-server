import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token obtained from the mobile client',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
