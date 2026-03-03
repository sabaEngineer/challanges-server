import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostLikes1708100400000 implements MigrationInterface {
  name = 'CreatePostLikes1708100400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "post_likes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "post_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_likes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_likes_post_user" UNIQUE ("post_id", "user_id"),
        CONSTRAINT "FK_post_likes_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_post_likes_post" ON "post_likes" ("post_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_post_likes_user" ON "post_likes" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_post_likes_user"`);
    await queryRunner.query(`DROP INDEX "IDX_post_likes_post"`);
    await queryRunner.query(`DROP TABLE "post_likes"`);
  }
}
