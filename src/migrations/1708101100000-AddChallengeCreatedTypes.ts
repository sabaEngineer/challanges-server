import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChallengeCreatedTypes1708101100000 implements MigrationInterface {
  name = 'AddChallengeCreatedTypes1708101100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "post_share_type" ADD VALUE 'challenge_created'
    `);
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE 'challenge_created'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values easily
  }
}
