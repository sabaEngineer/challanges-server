import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageReactions1708100200000 implements MigrationInterface {
  name = 'CreateMessageReactions1708100200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "reaction_type" AS ENUM (
        'thumbs_up', 'heart', 'laugh', 'wow', 'sad', 'angry'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "message_reactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "reaction_type" "reaction_type" NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_reactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_message_reactions_message" UNIQUE ("message_id"),
        CONSTRAINT "FK_message_reactions_message" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_message_reactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_reactions_message" ON "message_reactions" ("message_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_message_reactions_message"`);
    await queryRunner.query(`DROP TABLE "message_reactions"`);
    await queryRunner.query(`DROP TYPE "reaction_type"`);
  }
}
