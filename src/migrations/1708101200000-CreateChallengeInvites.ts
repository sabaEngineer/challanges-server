import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChallengeInvites1708101200000 implements MigrationInterface {
  name = 'CreateChallengeInvites1708101200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "challenge_invite_status" AS ENUM ('pending', 'accepted', 'declined')
    `);

    await queryRunner.query(`
      CREATE TABLE "challenge_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "challenge_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "invited_by" uuid NOT NULL,
        "status" "challenge_invite_status" NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_challenge_invites_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_challenge_invites_challenge_user" UNIQUE ("challenge_id", "user_id"),
        CONSTRAINT "FK_challenge_invites_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_invites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_challenge_invites_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_challenge_invites_user" ON "challenge_invites" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_challenge_invites_challenge" ON "challenge_invites" ("challenge_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_challenge_invites_challenge"`);
    await queryRunner.query(`DROP INDEX "IDX_challenge_invites_user"`);
    await queryRunner.query(`DROP TABLE "challenge_invites"`);
    await queryRunner.query(`DROP TYPE "challenge_invite_status"`);
  }
}
