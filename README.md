# reCAPTCHA Solver

Automated reCAPTCHA solver with monitoring dashboard.

## Features
- Automated reCAPTCHA solving
- Real-time monitoring dashboard
- Task management
- Live log viewer

## Installation
```bash
name: ravishing_takamitsu
services:
  backend:
    cpu_shares: 90
    command: []
    container_name: recaptcha-solver-backend
    deploy:
      resources:
        limits:
          memory: 3868M
    environment:
      - NODE_ENV=development
    hostname: recaptcha-solver-backend
    image: adamsetiaji/recaptcha-solver-backend:latest
    labels:
      icon: https://cdn.jsdelivr.net/gh/bigbeartechworld/big-bear-casaos/Apps/wg-easy/logo.png
    ports:
      - target: 3000
        published: "3000"
        protocol: tcp
      - target: 5900
        published: "5900"
        protocol: tcp
    restart: unless-stopped
    volumes:
      - type: bind
        source: /appdata/recaptcha/backend
        target: /app/backend
    devices: []
    cap_add: []
    networks:
      - recaptcha_network
    privileged: false
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
      - NODE_ENV=development
    hostname: recaptcha-solver-frontend
    image: adamsetiaji/recaptcha-solver-frontend:latest
    labels:
      icon: https://cdn.jsdelivr.net/gh/bigbeartechworld/big-bear-casaos/Apps/wg-easy/logo.png
    ports:
      - target: 5173
        published: "5173"
        protocol: tcp
    restart: unless-stopped
    volumes:
      - type: bind
        source: /appdata/recaptcha/frontend
        target: /app/frontend
    devices: []
    cap_add: []
    networks:
      - recaptcha_network
    privileged: false
networks:
  recaptcha_network:
    name: ravishing_takamitsu_recaptcha_network
    driver: bridge
x-casaos:
  author: self
  category: self
  hostname: ""
  icon: https://cdn.jsdelivr.net/gh/bigbeartechworld/big-bear-casaos/Apps/wg-easy/logo.png
  index: /
  is_uncontrolled: false
  port_map: "5173"
  scheme: http
  store_app_id: ravishing_takamitsu
  title:
    custom: recaptcha-solver
    en_us: backend
