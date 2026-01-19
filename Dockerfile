# ============================================
# Base Stage - Shared dependencies
# ============================================
FROM node:22-slim AS base
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    netcat-openbsd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies Stage - Install all deps
# ============================================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ============================================
# Development Stage
# ============================================
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
# Enable corepack for potential pnpm usage
RUN corepack enable
ENV NODE_ENV=development
EXPOSE 5173 3000
CMD ["npm", "run", "dev", "--", "--host"]

# ============================================
# Builder Stage - Build the app
# ============================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate React Router types and build
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM base AS prod
WORKDIR /app

# Copy built assets and package files
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies + drizzle-kit for migrations
RUN npm ci --omit=dev --ignore-scripts && \
    npm install drizzle-kit drizzle-orm mysql2 --save-prod --ignore-scripts

# Copy entrypoint script
COPY entrypoint.prod.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Copy drizzle migrations and schema
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY app/db ./app/db

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "run", "start"]
