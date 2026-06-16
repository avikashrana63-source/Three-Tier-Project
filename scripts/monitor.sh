#!/bin/bash

echo "===== BARISTA CAFE SERVER MONITORING ====="
echo "Date: $(date)"
echo

echo "CPU Usage:"
top -bn1 | head -5
echo

echo "Memory Usage:"
free -h
echo

echo "Disk Usage:"
df -h
echo

echo "Running Docker Containers:"
docker ps