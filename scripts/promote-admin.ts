/**
 * Promote a user to admin by email.
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/promote-admin.ts <email>
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node -r tsconfig-paths/register scripts/promote-admin.ts <email>');
    process.exit(1);
  }

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
    const result = await qr.query(
      `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, "firstName", "lastName", role`,
      [email],
    );

    if (result.length === 0) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    console.log(`Promoted to admin: ${result[0].email} (${result[0].firstName} ${result[0].lastName})`);
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

run();
