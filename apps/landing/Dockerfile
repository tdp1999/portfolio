# Stage 1: Builder
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.16.0 --activate

WORKDIR /app

# Copy full monorepo (build from root context)
COPY . .

# Install all dependencies (dev + prod needed for nx build)
RUN pnpm install --frozen-lockfile

# Build Landing SSR — outputs dist/apps/landing/ with server/ and browser/ bundles
RUN pnpm exec nx build landing --configuration=production

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built dist (server + browser bundles)
COPY --from=builder /app/dist/apps/landing/ ./

EXPOSE 4000

CMD ["node", "server/server.mjs"]
