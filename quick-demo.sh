#!/bin/bash

# NeuroBridge Quick Demo - Get Running in 2 Minutes!
set -e

echo "🧠 NeuroBridge Quick Demo Setup"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies (this may take a minute)..."
npm install --silent > /dev/null 2>&1 &
FRONTEND_PID=$!

cd backend
npm install --silent > /dev/null 2>&1 &
BACKEND_PID=$!

wait $FRONTEND_PID
wait $BACKEND_PID
cd ..

echo "✅ Dependencies installed"
echo ""

# Create .env if doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env..."
    cat > backend/.env << 'EOL'
DATABASE_URL="postgresql://neurobridge:neurobridge_dev_password@localhost:5432/neurobridge?schema=public"
JWT_SECRET="demo-secret-key-12345"
JWT_EXPIRES_IN="7d"
GEMINI_API_KEY=""
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
EOL
    echo "✅ Created backend/.env"
fi

# Create frontend .env.local
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOL'
VITE_API_URL=http://localhost:3000/api
EOL
    echo "✅ Created .env.local"
fi

echo ""
echo "🐳 Starting PostgreSQL with Docker..."

# Check if container already exists
if docker ps -a | grep -q neurobridge-postgres; then
    echo "   Found existing database, starting it..."
    docker start neurobridge-postgres > /dev/null 2>&1 || true
else
    echo "   Creating new database..."
    docker run -d \
      --name neurobridge-postgres \
      -e POSTGRES_USER=neurobridge \
      -e POSTGRES_PASSWORD=neurobridge_dev_password \
      -e POSTGRES_DB=neurobridge \
      -p 5432:5432 \
      postgres:15-alpine > /dev/null 2>&1
fi

# Wait for database
echo "   Waiting for database to be ready..."
sleep 3

echo "✅ Database ready"
echo ""

# Setup database
echo "🗄️  Setting up database..."
cd backend

# Generate Prisma client
echo "   Generating Prisma client..."
npx prisma generate > /dev/null 2>&1

# Run migrations
echo "   Running migrations..."
npx prisma migrate deploy > /dev/null 2>&1 || npx prisma migrate dev --name init > /dev/null 2>&1

# Seed data
echo "   Seeding sample data..."
npx prisma db seed > /dev/null 2>&1

cd ..

echo "✅ Database ready with demo data"
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🎉 SETUP COMPLETE!                                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Starting NeuroBridge..."
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000/api"
echo "   Swagger:  http://localhost:3000/api/docs"
echo ""
echo "🔐 Demo Login:"
echo "   Patient:  patient@neuro.io / password"
echo "   Provider: provider@neuro.io / password"
echo "   Mentor:   mentor@neuro.io / password"
echo ""
echo "📝 Press Ctrl+C to stop the demo"
echo ""

# Start both servers
npm run dev:all
