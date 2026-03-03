import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkipBuildTeamToUsers1708099700000 implements MigrationInterface {
  name = 'AddSkipBuildTeamToUsers1708099700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "skip_build_team" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "skip_build_team"
    `);
  }
}
