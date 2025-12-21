# Build stage: install dependencies, compile TypeScript, generate Prisma client
FROM node:20-alpine AS builder

ARG NPM_VERSION=11.6.4
WORKDIR /app

# DATABASE_URL must be provided at build time for Prisma generation
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npm install -g npm@${NPM_VERSION}
RUN apk add --no-cache python3 make g++

# Ensure Prisma schema is available before npm ci (prisma generate runs during install)
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
RUN npm rebuild bcrypt --build-from-source

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# Production stage: ship compiled code with dependencies and Prisma schema
FROM node:20-alpine AS production

ARG NPM_VERSION=11.6.4
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g npm@${NPM_VERSION}

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
