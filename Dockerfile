# ============================================================
# Dockerfile - Student Task Management App
# Module 4 - Practical 2: Dockerization & Cloud Deployment
# Author: Bhavya
# ============================================================

# Stage 1: Build stage (use full node image)
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package files first (leverages Docker layer caching)
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --only=production

# ============================================================
# Stage 2: Production stage
# ============================================================
FROM node:20-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create app user for security (avoid running as root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Create data directory for persistent storage
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Health check - Docker will monitor the app health
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]
