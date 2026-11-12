FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies (using debian-slim with glibc to prevent musl binding errors with vite/rolldown)
COPY package*.json tsconfig.json ./
RUN npm install --legacy-peer-deps

# Copy application source and build frontend
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies & tsx runtime
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm install -g tsx

# Copy built frontend & server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/constants/initialData.ts ./src/constants/initialData.ts
COPY --from=builder /app/src/types ./src/types

# Data persistence volume for home server
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["tsx", "server.ts"]
