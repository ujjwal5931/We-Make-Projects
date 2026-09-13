FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL & necessary libraries for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy package configurations
COPY package*.json .npmrc ./
COPY prisma ./prisma/

# Install dependencies (runs prisma generate via postinstall)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client with all binary targets & Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_TRUST_HOST=true
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/we_make_projects"
RUN npx prisma generate
RUN npm run build

# Production runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_TRUST_HOST=true

# Install OpenSSL in runner for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 -g nodejs nextjs

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads/screenshots /app/uploads/products /app/public/uploads/products /app/public/uploads/qr /app/prisma && \
    chown -R nextjs:nodejs /app


# Copy built application & dependencies with nextjs ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.npmrc ./.npmrc

USER nextjs

EXPOSE 3000

# Push DB schema & start production server
CMD ["sh", "-c", "npx prisma db push && npm start"]

