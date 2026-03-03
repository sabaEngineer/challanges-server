import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1708099200000 implements MigrationInterface {
  name = 'CreateUsersTable1708099200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "googleId" varchar(255),
        "firstName" varchar(255),
        "lastName" varchar(255),
        "picture" varchar(255),
        "email" varchar(255) NOT NULL,
        "pushToken" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_googleId" ON "users" ("googleId") WHERE "googleId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_googleId"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
