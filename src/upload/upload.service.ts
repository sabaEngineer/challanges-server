import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { UploadFolder } from './dto/presigned-url.dto';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudfrontDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    this.cloudfrontDomain = this.configService.get<string>('AWS_CLOUDFRONT_DOMAIN');
  }

  async generatePresignedUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    folder: UploadFolder,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const ext = fileName.split('.').pop() || 'jpg';
    const key = `${folder}/${userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    const fileUrl = `https://${this.cloudfrontDomain}/${key}`;

    return { uploadUrl, fileUrl, key };
  }
}
