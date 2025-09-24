#!/bin/bash

echo "========================================="
echo "BVOTE Backend - Install Dependencies"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
    echo "📋 Installed packages:"
    npm list --depth=0
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🎉 Backend ready to start!"
echo "Usage: npm start"
