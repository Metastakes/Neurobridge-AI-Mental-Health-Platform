#!/bin/bash

# NeuroBridge AI Setup Script
# Automates the setup process for local development

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🧠 NeuroBridge AI Mental Health Platform               ║"
echo "║   Setup Script                                            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to install PostgreSQL manually."
    echo "   Install Docker from: https://www.docker.com/products/docker-desktop"
    echo ""
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
echo "✅ Frontend dependencies installed"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating backend .env file from example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your API keys:"
    echo "   - GEMINI_API_KEY (required for AI features)"
    echo "   - GOOGLE_CLOUD_PROJECT_ID (optional, for Calendar)"
    echo "   - STRIPE_SECRET_KEY (optional, for payments)"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

cd ..

# Check if frontend .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating frontend .env.local file..."
    cat > .env.local << EOL
VITE_API_URL=http://localhost:3000/api
GEMINI_API_KEY=your-gemini-api-key-here
EOL
    echo "✅ .env.local file created"
    echo ""
else
    echo "✅ .env.local file already exists"
    echo ""
fi

# Offer to start Docker Compose
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    read -p "🐳 Start Docker services (PostgreSQL + Backend + Frontend)? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting Docker services..."
        docker-compose up -d
        echo "✅ Docker services started"
        echo ""
        echo "📊 View logs with: docker-compose logs -f"
        echo ""
    fi
else
    echo "ℹ️  To start the database manually:"
    echo "   docker run -d --name neurobridge-postgres \\"
    echo "     -e POSTGRES_USER=neurobridge \\"
    echo "     -e POSTGRES_PASSWORD=neurobridge_dev_password \\"
    echo "     -e POSTGRES_DB=neurobridge \\"
    echo "     -p 5432:5432 \\"
    echo "     postgres:15-alpine"
    echo ""
fi

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ Setup Complete!                                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔑 Add your GEMINI_API_KEY to backend/.env"
echo "   Get it from: https://ai.google.dev/"
echo ""
echo "2. 🗄️  Initialize the database:"
echo "   cd backend"
echo "   npx prisma migrate dev"
echo "   npx prisma db seed"
echo ""
echo "3. 🚀 Start the servers:"
echo "   npm run dev:all"
echo ""
echo "4. 🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000/api"
echo "   Swagger Docs: http://localhost:3000/api/docs"
echo ""
echo "🔐 Demo Login Credentials:"
echo "   Patient: patient@neuro.io / password"
echo "   Provider: provider@neuro.io / password"
echo "   Mentor: mentor@neuro.io / password"
echo ""
echo "📚 For more info, see README.md"
echo ""
