# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${FRONTEND_PORT:-5173}

# Ganti command untuk development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]