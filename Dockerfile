FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (supports builds with and without package-lock.json)
COPY package*.json tsconfig.json ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# Copy application source and build frontend
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies & tsx runtime
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --legacy-peer-deps; else npm install --omit=dev --legacy-peer-deps; fi \
    && npm install -g tsx

# Copy built frontend & server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/constants/initialData.ts ./src/constants/initialData.ts
COPY --from=builder /app/src/types ./src/types

# Data persistence volume for home server
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["tsx", "server.ts"]
