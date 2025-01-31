# root/Dockerfile
# Stage 1: Build Backend
FROM mcr.microsoft.com/playwright:v1.41.2-focal AS backend-build

# Install dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    x11-xserver-utils \
    x11vnc \
    fluxbox \
    curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ .

# Prepare custom libs
RUN mkdir -p libs/rektCaptcha
COPY backend/libs/rektCaptcha libs/rektCaptcha/

# Install Playwright
RUN npx playwright install chromium
RUN npx playwright install-deps

# Stage 2: Build Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend/ .

# Build frontend
RUN npm run build

# Final Stage: Combine Backend and Frontend
FROM mcr.microsoft.com/playwright:v1.41.2-focal

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    xvfb \
    x11-xserver-utils \
    x11vnc \
    fluxbox \
    curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build /app/backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose ports
EXPOSE 3000 5173

# Set environment
ENV NODE_ENV=development
ENV DISPLAY=:99

# Copy start script
COPY backend/start.sh ./
RUN chmod +x start.sh

# Set working directory to backend
WORKDIR /app/backend

# Default command
CMD ["../start.sh"]