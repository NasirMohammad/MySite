#!/bin/bash
cd /root/mysite || exit
git pull origin main
sudo docker-compose down
sudo docker-compose up -d --build
