# Stage 1: Builder
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.16.0 --activate

WORKDIR /app

# Copy full monorepo (build from root context)
COPY . .

# Install all dependencies (dev + prod needed for nx build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client (must run before build for type resolution)
RUN pnpm exec prisma generate --schema=apps/api/prisma/schema.prisma

# Build API — outputs dist/apps/api/ with main.js and package.json
RUN pnpm exec nx build api --configuration=production

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built dist (contains main.js and package.json with prod deps)
COPY --from=builder /app/dist/apps/api/ ./

# Copy Prisma schema + migrations for prisma migrate deploy
COPY --from=builder /app/apps/api/prisma/ ./prisma/

# Install production dependencies and generate Prisma client for linux/alpine
RUN npm install --omit=dev && npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma --url=$DATABASE_URL && node main.js"]
