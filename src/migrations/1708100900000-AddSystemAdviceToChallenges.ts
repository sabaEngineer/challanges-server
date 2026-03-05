import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemAdviceToChallenges1708100900000 implements MigrationInterface {
  name = 'AddSystemAdviceToChallenges1708100900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "challenges"
      ADD COLUMN "system_advice" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "challenges"
      DROP COLUMN "system_advice"
    `);
  }
}
