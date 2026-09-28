# Production Dockerfile for Professional Samadhan GST Platform
FROM node:20-slim

# Install system dependencies if required for canvas/tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Build static assets with Vite
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run with tsx
CMD ["npx", "tsx", "server.ts"]
