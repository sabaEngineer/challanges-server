import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const host = process.env.DB_HOST || 'localhost';

export default new DataSource({
  type: 'postgres',
  host,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'challenges',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  ssl: host !== 'localhost' ? { rejectUnauthorized: false } : false,
});
