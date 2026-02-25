#!/usr/bin/env node
/**
 * Prisma Query Helper — runs SELECT queries and prints results as a table.
 * Works anywhere @prisma/client is installed (dev, CI, prod containers).
 *
 * Usage:
 *   node query.js "SELECT COUNT(*) FROM users"
 *   node query.js "SELECT id, email FROM users LIMIT 5"
 *
 * Requires DATABASE_URL in environment or .env file at project root.
 *
 * Supports both adapter-based (Prisma v7 client engine) and classic PrismaClient.
 * Auto-detects which adapter package is available.
 */

const path = require('node:path');

// Load .env from project root (walk up from script location)
function loadEnv() {
  try {
    const dotenv = require('dotenv');
    const candidates = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '../../../../.env'),
    ];
    for (const envPath of candidates) {
      const result = dotenv.config({ path: envPath });
      if (!result.error) return;
    }
  } catch {
    // dotenv not available, rely on env vars being set
  }
}

function createPrismaClient() {
  const { PrismaClient } = require('@prisma/client');
  const connectionString = process.env.DATABASE_URL;

  // Try adapter-pg first (Prisma v7 client engine)
  try {
    const { PrismaPg } = require('@prisma/adapter-pg');
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter, log: [] });
  } catch {
    // adapter-pg not installed
  }

  // Try adapter-pg-worker
  try {
    const { PrismaPg } = require('@prisma/adapter-pg-worker');
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter, log: [] });
  } catch {
    // not installed
  }

  // Fallback: classic PrismaClient (binary/library engine)
  try {
    return new PrismaClient({ log: [] });
  } catch {
    // If classic also fails, the user's setup is unsupported
    console.error(
      'ERROR: Could not create PrismaClient. Install @prisma/adapter-pg or configure a compatible engine.',
    );
    process.exit(1);
  }
}

async function main() {
  const sql = process.argv[2];
  if (!sql) {
    console.error('Usage: node query.js "SQL query"');
    process.exit(1);
  }

  loadEnv();

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set');
    process.exit(1);
  }

  const prisma = createPrismaClient();

  try {
    const rows = await prisma.$queryRawUnsafe(sql);

    if (!rows || rows.length === 0) {
      console.log('(no rows)');
      return;
    }

    // Convert BigInt to Number for display
    const serialized = rows.map((row) => {
      const obj = {};
      for (const [key, value] of Object.entries(row)) {
        obj[key] = typeof value === 'bigint' ? Number(value) : value;
      }
      return obj;
    });

    console.table(serialized);
  } catch (err) {
    console.error('Query error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
