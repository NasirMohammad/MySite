#!/bin/bash

echo "=== DEPLOY START ==="

cd /root/mysite || exit

echo "Pulling latest code..."
git pull origin main

echo "Rebuilding containers (zero downtime)..."
sudo docker-compose up -d --build

echo "=== DEPLOY END ==="
