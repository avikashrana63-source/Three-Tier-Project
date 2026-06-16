#!/bin/bash

APP_DIR="/home/ubuntu/cafe_barista"

cd "$APP_DIR" || exit 1

git pull origin main

docker compose down
docker compose up -d --build

echo "Deployment completed successfully"