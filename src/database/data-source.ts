import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { Lead } from '../leads/entities/lead.entity';

loadEnv();

/**
 * Stand-alone TypeORM DataSource used by the seed script and (optionally) by
 * the TypeORM CLI for migrations.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'leads_db',
  entities: [Lead],
  synchronize: true,
  logging: false,
});
