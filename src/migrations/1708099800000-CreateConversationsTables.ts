import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationsTables1708099800000 implements MigrationInterface {
  name = 'CreateConversationsTables1708099800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "message_type" AS ENUM ('text', 'image', 'system')
    `);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user1_id" uuid NOT NULL,
        "user2_id" uuid NOT NULL,
        "pair_key" varchar(100) NOT NULL,
        "last_message_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversations_pair_key" UNIQUE ("pair_key"),
        CONSTRAINT "FK_conversations_user1" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversations_user2" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_user1" ON "conversations" ("user1_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_user2" ON "conversations" ("user2_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "type" "message_type" NOT NULL DEFAULT 'text',
        "text" text,
        "image_url" text,
        "image_storage_key" text,
        "image_mime_type" varchar(100),
        "image_size_bytes" bigint,
        "image_width" int,
        "image_height" int,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_conversation_created" ON "messages" ("conversation_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_sender" ON "messages" ("sender_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_messages_sender"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_conversation_created"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP INDEX "IDX_conversations_user2"`);
    await queryRunner.query(`DROP INDEX "IDX_conversations_user1"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TYPE "message_type"`);
  }
}
