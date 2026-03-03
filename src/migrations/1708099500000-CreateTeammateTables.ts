import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeammateTables1708099500000 implements MigrationInterface {
  name = 'CreateTeammateTables1708099500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "teammate_request_status" AS ENUM ('pending', 'accepted', 'declined', 'canceled', 'blocked')
    `);

    await queryRunner.query(`
      CREATE TABLE "teammate_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requester_id" uuid NOT NULL,
        "addressee_id" uuid NOT NULL,
        "status" "teammate_request_status" NOT NULL DEFAULT 'pending',
        "responded_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teammate_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_teammate_requests_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_teammate_requests_addressee" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_teammate_requests_requester" ON "teammate_requests" ("requester_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_teammate_requests_addressee" ON "teammate_requests" ("addressee_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "teammates" (
        "user_id" uuid NOT NULL,
        "teammate_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teammates_user_teammate" PRIMARY KEY ("user_id", "teammate_id"),
        CONSTRAINT "FK_teammates_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_teammates_teammate" FOREIGN KEY ("teammate_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "teammates"`);
    await queryRunner.query(`DROP INDEX "IDX_teammate_requests_addressee"`);
    await queryRunner.query(`DROP INDEX "IDX_teammate_requests_requester"`);
    await queryRunner.query(`DROP TABLE "teammate_requests"`);
    await queryRunner.query(`DROP TYPE "teammate_request_status"`);
  }
}
