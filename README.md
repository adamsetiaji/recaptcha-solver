# reCAPTCHA Solver

Automated reCAPTCHA solver with monitoring dashboard.

## Features
- Automated reCAPTCHA solving
- Real-time monitoring dashboard
- Task management
- Live log viewer

## Check Docker Image List
```bash
docker images
```

## Build Docker Images Locally
```bash
docker-compose up --build
```

## Tag and Push Docker Image to Docker Hub
```bash
docker tag recaptcha-solver-backend adamsetiaji/recaptcha-solver-backend:latest
docker push adamsetiaji/recaptcha-solver-backend:latest

docker tag recaptcha-solver-frontend adamsetiaji/recaptcha-solver-frontend:latest
docker push adamsetiaji/recaptcha-solver-frontend:latest
```


## Push to Github Repository
```bash
git remote add origin https://github.com/adamsetiaji/recaptcha-solver.git

git add .
git commit -m "Initial commit: Add Logo"
git push -u origin master --force
```


## CasaOS Deployment Configuration
```bash
name: ravishing_takamitsu

networks:
  recaptcha_network:
    driver: bridge

services:
  frontend:
    cpu_shares: 90
    command: []
    container_name: recaptcha-solver-frontend
    depends_on:
      backend:
        condition: service_started
        required: true
    deploy:
      resources:
        limits:
          memory: 3868M
    environment:
      - NODE_ENV=production
      - VITE_ALLOWED_HOSTS=localhost,example.com
      - VITE_BACKEND_URL=https://api.example.com
    hostname: recaptcha-solver-frontend
    image: adamsetiaji/recaptcha-solver-frontend:latest
    labels:
      icon: https://raw.githubusercontent.com/adamsetiaji/recaptcha-solver/refs/heads/master/recaptcha-solver.png
    ports:
      - "5173:5173"
    restart: unless-stopped
    volumes:
      - type: bind
        source: ./appdata/recaptcha/frontend
        target: /app/frontend
    networks:
      - recaptcha_network
    devices: []
    cap_add: []
    privileged: false

  backend:
    cpu_shares: 90
    command: []
    container_name: recaptcha-solver-backend
    deploy:
      resources:
        limits:
          memory: 3868M
    environment:
      - BACKEND_PORT=3000
      - DISPLAY=:99
      - NODE_ENV=production
      - VNC_PORT=5900
    hostname: recaptcha-solver-backend
    image: adamsetiaji/recaptcha-solver-backend:latest
    labels:
      icon: https://raw.githubusercontent.com/adamsetiaji/recaptcha-solver/refs/heads/master/recaptcha-solver.png
    ports:
      - "3000:3000"
      - "5900:5900"
    restart: unless-stopped
    volumes:
      - type: bind
        source: ./appdata/recaptcha/backend
        target: /app/backend
    networks:
      - recaptcha_network
    devices: []
    cap_add: []
    privileged: false
x-casaos:
  author: self
  category: self
  hostname: example.com
  icon: https://raw.githubusercontent.com/adamsetiaji/recaptcha-solver/refs/heads/master/recaptcha-solver.png
  index: /
  is_uncontrolled: false
  port_map: ""
  scheme: https
  store_app_id: ravishing_takamitsu
  title:
    custom: Recaptcha Solver
    en_us: Recaptcha Solver
```
