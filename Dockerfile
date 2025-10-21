# Multi-stage Dockerfile for Chore App (Frontend + Backend)

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY client/ ./

# Build the React app for production
RUN npm run build

# Stage 2: Setup backend and combine with frontend
FROM node:18-alpine

WORKDIR /app

# Install production dependencies for backend
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy backend source
COPY server/ ./server/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/client/build ./server/public

# Create directory for SQLite database
RUN mkdir -p /app/server/data

# Expose the backend port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Set working directory to server
WORKDIR /app/server

# Start the backend server (which will also serve the frontend)
CMD ["node", "index.js"]
