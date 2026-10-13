#!/usr/bin/env bash
# Weeks 7-10: build and run CareerConnect in Docker
set -e
docker build -t careerconnect:latest .
docker rm -f careerconnect 2>/dev/null || true
docker run -d --name careerconnect -p 3000:3000 careerconnect:latest
docker ps --filter name=careerconnect
echo "Open http://localhost:3000"
