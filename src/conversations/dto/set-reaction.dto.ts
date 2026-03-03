import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../entities/message-reaction.entity';

export class SetReactionDto {
  @ApiProperty({
    enum: ReactionType,
    description: 'Reaction type (thumbs_up, heart, laugh, wow, sad, angry)',
  })
  @IsEnum(ReactionType)
  reaction_type: ReactionType;
}
