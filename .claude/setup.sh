#!/bin/bash
# Runs automatically at the start of every Claude Code web session.
# Safe to run repeatedly — each step checks before acting.

echo "=== Session Setup ==="

# 1. Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "✓ node_modules present"
fi

# 2. Install Playwright browser if needed
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "/root/.cache/ms-playwright" ]; then
  echo "Installing Playwright Chromium..."
  npx playwright install chromium --with-deps
else
  echo "✓ Playwright browsers present"
fi

echo "=== Ready ==="
echo "Run tests with: npx playwright test"
echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'not a git repo')"
echo "Last commit: $(git log --oneline -1 2>/dev/null || echo 'no commits yet')"
