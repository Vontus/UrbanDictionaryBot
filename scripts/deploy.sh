#!/bin/bash
# Deploy to Raspberry Pi.
# Usage: PI_HOST=user@raspberrypi ./scripts/deploy.sh
# Optional: PI_PATH=~/urbandictionarybot (default: ~/urbandictionarybot)
set -e

PI_HOST=${PI_HOST:?'Set PI_HOST=user@host before running this script'}
PI_PATH=${PI_PATH:-~/urbandictionarybot}

echo "==> Building..."
npm run build
npm test

echo "==> Syncing to $PI_HOST:$PI_PATH ..."
rsync -av --delete \
  dist/ \
  package.json \
  package-lock.json \
  resources/ \
  "$PI_HOST:$PI_PATH/"

echo "==> Installing production deps on Pi..."
ssh "$PI_HOST" "cd $PI_PATH && npm ci --omit=dev"

echo ""
echo "Deploy complete. Restart the bot on the Pi to pick up changes."
