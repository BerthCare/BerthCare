# Build stage: install dependencies, compile TypeScript, generate Prisma client
FROM node:20-alpine AS builder

WORKDIR /app

# DATABASE_URL must be provided at build time for Prisma generation
ARG DATABASE_URL="postgresql://CHANGE_ME:CHANGE_ME@localhost:5432/berthcare"
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build
RUN npx prisma generate

# Production stage: ship compiled code with dependencies and Prisma schema
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package*.json ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
