import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default defineConfig({
  schema: 'schema.prisma',
  migrations: {
    path: 'migrations',
    seed: `npx tsx ${path.resolve(__dirname, 'seed.ts')}`,
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
