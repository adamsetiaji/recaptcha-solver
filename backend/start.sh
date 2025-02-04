#!/bin/bash

# Start Xvfb
Xvfb :99 -screen 0 1920x1080x24 &

# Wait a bit for Xvfb to start
sleep 2

# Set DISPLAY variable
export DISPLAY=:99

# Start window manager
fluxbox &

# Start VNC server
x11vnc -ncache 10 -display :99 -forever -nopw &

# Start the application
npm start