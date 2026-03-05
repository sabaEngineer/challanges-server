import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsFavoriteToTeammates1708101000000 implements MigrationInterface {
  name = 'AddIsFavoriteToTeammates1708101000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teammates"
      ADD COLUMN "is_favorite" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "teammates"
      DROP COLUMN "is_favorite"
    `);
  }
}
