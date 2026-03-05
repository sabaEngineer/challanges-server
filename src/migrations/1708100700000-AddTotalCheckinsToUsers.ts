import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalCheckinsToUsers1708100700000 implements MigrationInterface {
  name = 'AddTotalCheckinsToUsers1708100700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "total_checkins" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE users SET total_checkins = (
        SELECT COUNT(*)::int FROM challenge_checkins
        WHERE user_id = users.id AND status = 'success'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "total_checkins"
    `);
  }
}
