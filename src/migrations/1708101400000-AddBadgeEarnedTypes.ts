import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBadgeEarnedTypes1708101400000 implements MigrationInterface {
  name = 'AddBadgeEarnedTypes1708101400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "post_share_type" ADD VALUE 'badge_earned'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE 'badge_earned'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values easily
  }
}
