# ---- Build Stage ----
FROM node:23-alpine AS builder

WORKDIR /app

# Copy prisma schema first (needed by postinstall hook)
COPY prisma ./prisma

# Configure npm for SSL
RUN npm config set strict-ssl false

# Install dependencies (includes devDeps like tsx for seeding)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Build Next.js
RUN npm run build

# ---- Production Stage ----
FROM node:23-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma CLI for migrations in entrypoint
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma /usr/local/bin/prisma

# Copy seed dependencies
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/typescript ./node_modules/typescript
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/content ./content

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create uploads directory
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PRISMA_SKIP_VALIDATE=true

ENTRYPOINT ["/entrypoint.sh"]
