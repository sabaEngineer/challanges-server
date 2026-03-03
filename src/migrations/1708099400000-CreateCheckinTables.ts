import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckinTables1708099400000 implements MigrationInterface {
  name = 'CreateCheckinTables1708099400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "checkin_status" AS ENUM ('success', 'failed')
    `);

    await queryRunner.query(`
      CREATE TYPE "post_media_type" AS ENUM ('image', 'video')
    `);

    await queryRunner.query(`
      CREATE TABLE "challenge_checkins" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "challenge_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "member_id" uuid NOT NULL,
        "checkin_date" date NOT NULL,
        "status" "checkin_status" NOT NULL,
        "text" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_challenge_checkins_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_challenge_checkins_member_date" UNIQUE ("member_id", "checkin_date"),
        CONSTRAINT "FK_challenge_checkins_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_checkins_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_checkins_member" FOREIGN KEY ("member_id") REFERENCES "challenge_members"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_challenge_checkins_challenge_date" ON "challenge_checkins" ("challenge_id", "checkin_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_challenge_checkins_user_date" ON "challenge_checkins" ("user_id", "checkin_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_challenge_checkins_created_at" ON "challenge_checkins" ("created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "checkin_media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "checkin_id" uuid NOT NULL,
        "type" "post_media_type" NOT NULL,
        "url" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checkin_media_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_checkin_media_checkin" FOREIGN KEY ("checkin_id") REFERENCES "challenge_checkins"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checkin_media_checkin_id" ON "checkin_media" ("checkin_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_checkin_media_checkin_id"`);
    await queryRunner.query(`DROP TABLE "checkin_media"`);
    await queryRunner.query(`DROP INDEX "IDX_challenge_checkins_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_challenge_checkins_user_date"`);
    await queryRunner.query(`DROP INDEX "IDX_challenge_checkins_challenge_date"`);
    await queryRunner.query(`DROP TABLE "challenge_checkins"`);
    await queryRunner.query(`DROP TYPE "post_media_type"`);
    await queryRunner.query(`DROP TYPE "checkin_status"`);
  }
}
