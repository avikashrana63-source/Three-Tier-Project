#!/bin/bash

FRONTEND_URL="http://localhost:8085"
BACKEND_URL="http://localhost:8085/api/health"

echo "Checking frontend..."
curl -fsS -o /dev/null "$FRONTEND_URL" && echo "Frontend is healthy" || echo "Frontend is down"

echo
echo "Checking backend..."
curl -fsS -o /dev/null "$BACKEND_URL" && echo "Backend is healthy" || echo "Backend is down"
