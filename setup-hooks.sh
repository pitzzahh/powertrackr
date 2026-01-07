#!/bin/sh

# Script to setup Git hooks

echo "Setting up Git hooks..."

# Configure Git to use .githooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks configured successfully!"
echo "Hooks will now run from .githooks directory"
