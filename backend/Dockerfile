FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# -------------------------------------------------------
# Production Runner — lightweight final image
# -------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy compiled dist from builder stage
COPY --from=builder /app/dist ./dist

# Render dynamically assigns PORT via env variable
# Default fallback to 5000 if not set
ENV PORT=5000
EXPOSE 5000

# Health check for Render
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/server.js"]
