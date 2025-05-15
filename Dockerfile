# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy the built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib/queue/worker.ts ./lib/queue/worker.ts

# Install Redis
RUN apk add --no-cache redis

# Install PM2 globally for process management
RUN npm install -g pm2 tsx

# Create a script to run the application
RUN echo '#!/bin/sh\n\
# Start Redis server\nredis-server --daemonize yes\n\
# Start worker process\npm2 start "tsx lib/queue/worker.ts" --name "worker"\n\
# Start Next.js server\nnode server.js\n' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]