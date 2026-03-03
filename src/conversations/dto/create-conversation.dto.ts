import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'Teammate user ID to start conversation with' })
  @IsNotEmpty()
  @IsUUID()
  teammate_id: string;
}
