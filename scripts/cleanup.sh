#!/bin/bash

LOG_DIR="/var/log"
DAYS=7

find "$LOG_DIR" -type f -name "*.log" -mtime +"$DAYS" -delete

echo "Old logs cleaned successfully"