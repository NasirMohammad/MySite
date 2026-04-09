#!/bin/bash

echo "=== DEPLOY START ==="

cd /root/mysite || exit

echo "Pulling latest code..."
git pull origin main

echo "Stopping containers..."
sudo docker-compose down

echo "Starting containers..."
sudo docker-compose up -d --build

echo "=== DEPLOY END ==="
