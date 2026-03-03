/**
 * Cleans the database: removes all users and their progress, keeps challenges.
 * Creates a "system" user to preserve challenges.created_by FK.
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/clean-db-keep-challenges.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const SYSTEM_USER_EMAIL = 'system@challenges.local';

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const dataSource = new DataSource({
    type: 'postgres',
    host,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'challenges',
    ssl: host !== 'localhost' ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();

  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('Cleaning database (keeping challenges)...');

    await qr.query('DELETE FROM checkin_media');
    console.log('  - Deleted checkin_media');

    await qr.query('DELETE FROM challenge_checkins');
    console.log('  - Deleted challenge_checkins');

    await qr.query('DELETE FROM challenge_members');
    console.log('  - Deleted challenge_members');

    await qr.query('DELETE FROM notifications');
    console.log('  - Deleted notifications');

    await qr.query('DELETE FROM messages');
    console.log('  - Deleted messages');

    await qr.query('DELETE FROM conversations');
    console.log('  - Deleted conversations');

    await qr.query('DELETE FROM teammates');
    console.log('  - Deleted teammates');

    await qr.query('DELETE FROM teammate_requests');
    console.log('  - Deleted teammate_requests');

    const systemUser = await qr.query(
      `SELECT id FROM users WHERE email = $1`,
      [SYSTEM_USER_EMAIL],
    );

    let systemUserId: string;

    if (systemUser.length === 0) {
      const insert = await qr.query(
        `INSERT INTO users ("googleId", "firstName", "lastName", "picture", "email", "pushToken", "skip_build_team", "created_at", "updated_at")
         VALUES (NULL, 'System', 'User', NULL, $1, NULL, true, now(), now())
         RETURNING id`,
        [SYSTEM_USER_EMAIL],
      );
      systemUserId = insert[0].id;
      console.log('  - Created system user');
    } else {
      systemUserId = systemUser[0].id;
    }

    await qr.query(
      `UPDATE challenges SET created_by = $1 WHERE created_by != $1`,
      [systemUserId],
    );
    console.log('  - Updated challenges to use system user');

    await qr.query(`DELETE FROM users WHERE id != $1`, [systemUserId]);
    console.log('  - Deleted all other users');

    await qr.commitTransaction();
    console.log('Done. Challenges kept, all users and progress removed.');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('Error:', err);
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

run();
