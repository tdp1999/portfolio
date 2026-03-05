# Stage 1: Builder
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.16.0 --activate

WORKDIR /app

# Copy full monorepo (build from root context)
COPY . .

# Install all dependencies (dev + prod needed for nx build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client (must run before build for type resolution)
RUN pnpm exec prisma generate --config=apps/api/prisma/prisma.config.ts

# Build API — outputs dist/apps/api/ with main.js and package.json
RUN pnpm exec nx build api --configuration=production

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built dist (contains main.js and package.json with prod deps)
COPY --from=builder /app/dist/apps/api/ ./

# Copy Prisma schema + migrations + config for prisma migrate deploy
COPY --from=builder /app/apps/api/prisma/ ./prisma/

# Install production dependencies + Prisma CLI + ts-node (needed for prisma.config.ts)
RUN npm install --omit=dev && npm install prisma@7.4.0 ts-node typescript

# Generate Prisma client for linux/alpine
RUN npx prisma generate --config=./prisma/prisma.config.ts

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config=./prisma/prisma.config.ts && node main.js"]
