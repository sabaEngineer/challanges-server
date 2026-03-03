import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoMessageSupport1708100000000 implements MigrationInterface {
  name = 'AddVideoMessageSupport1708100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "message_type" ADD VALUE 'video'
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN "video_url" text,
      ADD COLUMN "video_storage_key" text,
      ADD COLUMN "video_mime_type" varchar(100),
      ADD COLUMN "video_size_bytes" bigint,
      ADD COLUMN "video_duration_seconds" int
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
      DROP COLUMN "video_url",
      DROP COLUMN "video_storage_key",
      DROP COLUMN "video_mime_type",
      DROP COLUMN "video_size_bytes",
      DROP COLUMN "video_duration_seconds"
    `);
    // PostgreSQL doesn't support removing enum values easily; would need to recreate the type
    // For simplicity, we leave 'video' in the enum on revert
  }
}
