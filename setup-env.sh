#!/bin/bash

# TREZA SDK Environment Setup Script
# This script helps you create a .env file with the correct configuration

set -e

echo "🔧 TREZA SDK Environment Setup"
echo "================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 0
    fi
    echo ""
fi

# Copy example file
if [ ! -f .env.example ]; then
    echo "❌ Error: .env.example not found!"
    exit 1
fi

cp .env.example .env
echo "✅ Created .env file from .env.example"
echo ""

# Get user input
echo "📝 Configuration Options:"
echo ""
echo "1. What environment are you setting up?"
echo "   1) Local development (localhost:3000)"
echo "   2) Production (api.treza.io)"
echo "   3) Custom URL"
read -p "Select option (1-3): " env_choice

case $env_choice in
    1)
        API_URL="http://localhost:3000/api"
        ;;
    2)
        API_URL="https://api.treza.io/api"
        ;;
    3)
        read -p "Enter custom API URL: " API_URL
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

# Update .env file
sed -i.bak "s|TREZA_API_URL=.*|TREZA_API_URL=$API_URL|" .env
rm .env.bak 2>/dev/null || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Configuration:"
echo "   API URL: $API_URL"
echo "   RPC URL: https://rpc.sepolia.org"
echo "   Contract: 0xB1D98F688Fac29471D91234d9f8EbB37238Df6FA"
echo ""
echo "💡 Next steps:"
echo "   1. Edit .env to add your TREZA_API_KEY (if needed)"
echo "   2. Edit .env to add your PRIVATE_KEY (for write operations)"
echo "   3. Run examples: npx tsx examples/kyc/check-adult.ts <proofId>"
echo ""
echo "📚 Documentation: ./QUICK_REFERENCE.md"
