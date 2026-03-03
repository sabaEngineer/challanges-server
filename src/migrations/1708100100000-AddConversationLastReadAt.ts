import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationLastReadAt1708100100000 implements MigrationInterface {
  name = 'AddConversationLastReadAt1708100100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversations"
      ADD COLUMN "user1_last_read_at" timestamp,
      ADD COLUMN "user2_last_read_at" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversations"
      DROP COLUMN "user1_last_read_at",
      DROP COLUMN "user2_last_read_at"
    `);
  }
}
