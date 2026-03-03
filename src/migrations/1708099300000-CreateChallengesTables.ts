import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChallengesTables1708099300000 implements MigrationInterface {
  name = 'CreateChallengesTables1708099300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "challenge_visibility" AS ENUM ('public', 'teammates_only', 'private_invite')
    `);

    await queryRunner.query(`
      CREATE TYPE "challenge_types" AS ENUM ('strict', 'flexible')
    `);

    await queryRunner.query(`
      CREATE TYPE "checkin_media_requirement" AS ENUM ('none', 'image_or_video_required', 'image_required', 'video_required')
    `);

    await queryRunner.query(`
      CREATE TABLE "challenges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "description" text,
        "imageUrl" text,
        "visibility" "challenge_visibility" NOT NULL DEFAULT 'public',
        "type" "challenge_types" NOT NULL,
        "media_requirement" "checkin_media_requirement" NOT NULL DEFAULT 'none',
        "start_date" date NOT NULL,
        "end_date" date,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_challenges_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_challenges_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "challenge_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "challenge_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" varchar NOT NULL DEFAULT 'active',
        "current_streak" int NOT NULL DEFAULT 0,
        "best_streak" int NOT NULL DEFAULT 0,
        CONSTRAINT "PK_challenge_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_challenge_members_challenge_user" UNIQUE ("challenge_id", "user_id"),
        CONSTRAINT "FK_challenge_members_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_challenge_members_user_id" ON "challenge_members" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_challenge_members_user_id"`);
    await queryRunner.query(`DROP TABLE "challenge_members"`);
    await queryRunner.query(`DROP TABLE "challenges"`);
    await queryRunner.query(`DROP TYPE "checkin_media_requirement"`);
    await queryRunner.query(`DROP TYPE "challenge_types"`);
    await queryRunner.query(`DROP TYPE "challenge_visibility"`);
  }
}
