import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostsTables1708100300000 implements MigrationInterface {
  name = 'CreatePostsTables1708100300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "post_share_type" AS ENUM (
        'win', 'learned', 'advice', 'motivate', 'moment',
        'lesson', 'next_time', 'honesty', 'support', 'general'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "challenge_id" uuid,
        "checkin_id" uuid,
        "share_type" "post_share_type" NOT NULL,
        "text" varchar(500),
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_posts_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_posts_checkin" FOREIGN KEY ("checkin_id") REFERENCES "challenge_checkins"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_posts_user" ON "posts" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_challenge" ON "posts" ("challenge_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_posts_created_at" ON "posts" ("created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "post_media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "type" "post_media_type" NOT NULL,
        "url" text NOT NULL,
        "storage_key" text,
        "mime_type" varchar(100),
        "size_bytes" bigint,
        "width" int,
        "height" int,
        "duration_seconds" float,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_media_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_post_media_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_post_media_post" ON "post_media" ("post_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_post_media_post"`);
    await queryRunner.query(`DROP TABLE "post_media"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_challenge"`);
    await queryRunner.query(`DROP INDEX "IDX_posts_user"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TYPE "post_share_type"`);
  }
}
