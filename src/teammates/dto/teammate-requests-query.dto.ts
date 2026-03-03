import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum RequestType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export class TeammateRequestsQueryDto {
  @ApiPropertyOptional({ enum: RequestType, default: RequestType.INCOMING })
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType = RequestType.INCOMING;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
