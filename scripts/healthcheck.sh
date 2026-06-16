#!/bin/bash

FRONTEND_URL="http://localhost:8085"
BACKEND_URL="http://localhost:3000/api/health"

echo "Checking frontend..."
curl -f "$FRONTEND_URL" && echo "Frontend is healthy" || echo "Frontend is down"

echo
echo "Checking backend..."
curl -f "$BACKEND_URL" && echo "Backend is healthy" || echo "Backend is down"