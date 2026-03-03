import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostLikeNotificationType1708100500000 implements MigrationInterface {
  name = 'AddPostLikeNotificationType1708100500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE 'post_like'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values easily
  }
}
