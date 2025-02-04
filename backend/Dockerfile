# backend/Dockerfile
FROM mcr.microsoft.com/playwright:v1.41.2-focal

# Install xvfb, x11vnc, and fluxbox
RUN apt-get update && apt-get install -y \
    xvfb \
    x11-xserver-utils \
    x11vnc \
    fluxbox

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN chmod +x start.sh

RUN mkdir -p libs/rektCaptcha
COPY libs/rektCaptcha libs/rektCaptcha/

RUN npx playwright install chromium
RUN npx playwright install-deps

EXPOSE ${BACKEND_PORT:-3000}
EXPOSE ${VNC_PORT:-5900}


CMD ["./start.sh"]