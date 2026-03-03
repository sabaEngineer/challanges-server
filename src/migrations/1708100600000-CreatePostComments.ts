import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostComments1708100600000 implements MigrationInterface {
  name = 'CreatePostComments1708100600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "post_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "text" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_post_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_comments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_post_comments_post" ON "post_comments" ("post_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_post_comments_created" ON "post_comments" ("post_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "comment_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "comment_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comment_likes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_comment_likes_comment_user" UNIQUE ("comment_id", "user_id"),
        CONSTRAINT "FK_comment_likes_comment" FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comment_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_comment_likes_comment" ON "comment_likes" ("comment_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_comment_likes_comment"`);
    await queryRunner.query(`DROP TABLE "comment_likes"`);
    await queryRunner.query(`DROP INDEX "IDX_post_comments_created"`);
    await queryRunner.query(`DROP INDEX "IDX_post_comments_post"`);
    await queryRunner.query(`DROP TABLE "post_comments"`);
  }
}
