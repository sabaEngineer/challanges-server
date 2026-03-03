import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTeammateRequestDto {
  @ApiProperty({ description: 'User ID to send team up request to' })
  @IsUUID()
  @IsNotEmpty()
  addressee_id: string;
}
