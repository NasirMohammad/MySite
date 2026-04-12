#!/bin/bash

echo "=== DEPLOY START ==="

cd /root/mysite || exit

echo "Pulling latest code..."
git pull origin main

# Detect active container
if grep -q "nodeapp_blue" default.conf; then
    CURRENT="blue"
    TARGET="green"
else
    CURRENT="green"
    TARGET="blue"
fi

echo "Current active: $CURRENT"
echo "Deploying new version to: $TARGET"

# Build target container only
echo "Building nodeapp_$TARGET..."
sudo docker-compose up -d --build nodeapp_$TARGET

# Wait for container to start
echo "Waiting for container to be ready..."
sleep 10

# Switch nginx upstream
echo "Switching traffic..."

if [ "$TARGET" = "green" ]; then
    sed -i 's/nodeapp_blue/nodeapp_green/' default.conf
else
    sed -i 's/nodeapp_green/nodeapp_blue/' default.conf
fi

# Reload nginx
echo "Reloading nginx..."
docker exec nginx-proxy nginx -s reload

# Stop old container
echo "Stopping old container: nodeapp_$CURRENT"
sudo docker stop nodeapp_$CURRENT

echo "=== DEPLOY END ==="
