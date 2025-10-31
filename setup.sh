#!/bin/bash

# NeuroBridge Platform Setup Script
# Run this to set up your local development environment

set -e

echo "🏥 NeuroBridge Platform Setup"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env

    # Generate random SECRET_KEY
    SECRET_KEY=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    else
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    fi

    echo "✅ .env file created"
    echo "⚠️  IMPORTANT: Edit .env and add your API keys (Stripe, Twilio, etc.)"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create backend .env if it doesn't exist
if [ ! -f backend-fastapi/.env ]; then
    echo "📝 Creating backend .env file..."
    cat > backend-fastapi/.env << EOF
DATABASE_URL=postgresql://neurobridge:secure_password_change_me@postgres:5432/neurobridge
REDIS_URL=redis://:redis_password_change_me@redis:6379/0
SECRET_KEY=$SECRET_KEY
DEBUG=true
EOF
    echo "✅ Backend .env created"
    echo ""
fi

# Create frontend .env.local if it doesn't exist
if [ ! -f frontend-nextjs/.env.local ]; then
    echo "📝 Creating frontend .env.local file..."
    cat > frontend-nextjs/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
EOF
    echo "✅ Frontend .env.local created"
    echo ""
fi

# Pull and build Docker images
echo "🐳 Building Docker containers (this may take a few minutes)..."
docker-compose build

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Run: docker-compose up"
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "📚 Need help? Check DEVELOPMENT_MASTER_PLAN.md"
