#!/bin/bash
# Usage: DEPLOY_HOST=user@host ./scripts/deploy.sh
# Optional: DEPLOY_PATH=~/urbandictionarybot (default: ~/urbandictionarybot)
set -e

DEPLOY_HOST=${DEPLOY_HOST:?'Set DEPLOY_HOST=user@host before running this script'}
DEPLOY_PATH=${DEPLOY_PATH:-~/urbandictionarybot}

echo "==> Building..."
npm run build
npm test

echo "==> Syncing to $DEPLOY_HOST:$DEPLOY_PATH ..."
rsync -av --delete \
  dist/ \
  package.json \
  package-lock.json \
  resources/ \
  "$DEPLOY_HOST:$DEPLOY_PATH/"

echo "==> Installing production deps..."
ssh "$DEPLOY_HOST" "cd $DEPLOY_PATH && npm ci --omit=dev"

echo ""
echo "Deploy complete. Restart the bot to pick up changes."
