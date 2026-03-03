import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UploadFolder {
  PROFILE = 'profile',
  CHECKIN = 'checkin',
  CHALLENGE = 'challenge',
  MESSAGE = 'message',
}

export class PresignedUrlRequestDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'photo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Upload folder/category',
    enum: UploadFolder,
    example: UploadFolder.CHECKIN,
  })
  @IsEnum(UploadFolder)
  folder: UploadFolder;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Pre-signed URL for uploading the file to S3' })
  uploadUrl: string;

  @ApiProperty({ description: 'Public URL via CloudFront to access the file after upload' })
  fileUrl: string;

  @ApiProperty({ description: 'S3 storage key' })
  key: string;
}
