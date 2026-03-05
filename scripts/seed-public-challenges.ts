/**
 * Seeds 3 additional public challenges.
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/seed-public-challenges.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const SYSTEM_USER_EMAIL = 'system@challenges.local';

const CHALLENGES = [
  {
    title: '30-Day Meditation',
    description: 'Build a daily meditation habit. Start with 5 minutes and increase as you go.',
    visibility: 'public',
    type: 'flexible',
    media_requirement: 'none',
  },
  {
    title: 'Read 20 Pages Daily',
    description: 'Read at least 20 pages every day. Books, articles, or any reading material counts.',
    visibility: 'public',
    type: 'flexible',
    media_requirement: 'none',
  },
  {
    title: 'Morning Run Streak',
    description: 'Run or jog every morning. Track your distance and build consistency.',
    visibility: 'public',
    type: 'strict',
    media_requirement: 'image_or_video_required',
  },
];

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

  try {
    let systemUserId = (
      await qr.query(`SELECT id FROM users WHERE email = $1`, [SYSTEM_USER_EMAIL])
    )[0]?.id;

    if (!systemUserId) {
      const insert = await qr.query(
        `INSERT INTO users ("googleId", "firstName", "lastName", "picture", "email", "pushToken", "skip_build_team", "total_checkins", "created_at", "updated_at")
         VALUES (NULL, 'System', 'User', NULL, $1, NULL, true, 0, now(), now())
         RETURNING id`,
        [SYSTEM_USER_EMAIL],
      );
      systemUserId = insert[0].id;
      console.log('Created system user for challenge ownership');
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
    const endDateStr = endDate.toISOString().split('T')[0];

    for (const c of CHALLENGES) {
      await qr.query(
        `INSERT INTO challenges (title, description, "imageUrl", visibility, type, media_requirement, start_date, end_date, created_by)
         VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8)`,
        [
          c.title,
          c.description,
          c.visibility,
          c.type,
          c.media_requirement,
          today,
          endDateStr,
          systemUserId,
        ],
      );
      console.log(`  - Created: ${c.title}`);
    }

    console.log('Done. 3 public challenges added.');
  } catch (err) {
    console.error('Error:', err);
    throw err;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

run();
