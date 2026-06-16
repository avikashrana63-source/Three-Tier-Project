#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/home/ubuntu/cafe_barista"
DATE=$(date +%F-%H-%M-%S)

mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/barista-cafe-backup-$DATE.tar.gz" "$APP_DIR"

echo "Backup completed successfully"