import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageStatus1708099900000 implements MigrationInterface {
  name = 'AddMessageStatus1708099900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "message_status" AS ENUM ('sent', 'delivered', 'read')
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD COLUMN "status" "message_status" NOT NULL DEFAULT 'sent'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages" DROP COLUMN "status"
    `);
    await queryRunner.query(`DROP TYPE "message_status"`);
  }
}
