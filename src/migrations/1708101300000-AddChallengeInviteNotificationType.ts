import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChallengeInviteNotificationType1708101300000 implements MigrationInterface {
  name = 'AddChallengeInviteNotificationType1708101300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "notification_type" ADD VALUE 'challenge_invite'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL doesn't support removing enum values easily
  }
}
