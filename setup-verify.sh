#!/bin/bash
# NeuroBridge Setup Verification Script
# Run this to verify everything is configured correctly before starting

set -e  # Exit on error

echo "🔍 NeuroBridge Setup Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
ERRORS=0

# Function to print status
print_status() {
    if [ "$1" = "ok" ]; then
        echo -e "${GREEN}✓${NC} $2"
        SUCCESS=$((SUCCESS + 1))
    elif [ "$1" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $2"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📋 Checking Prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "ok" "Node.js installed: $NODE_VERSION"
else
    print_status "error" "Node.js not found. Install from https://nodejs.org"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_status "ok" "npm installed: $NPM_VERSION"
else
    print_status "error" "npm not found"
fi

# Check PostgreSQL or Docker
if command -v psql &> /dev/null; then
    print_status "ok" "PostgreSQL client found"
elif command -v docker &> /dev/null; then
    print_status "ok" "Docker found (can use for PostgreSQL)"
else
    print_status "warn" "Neither PostgreSQL nor Docker found. You'll need one of them."
fi

echo ""
echo "📁 Checking Project Files..."
echo ""

# Check backend files
if [ -f "backend/package.json" ]; then
    print_status "ok" "Backend package.json exists"
else
    print_status "error" "Backend package.json missing"
fi

if [ -f "backend/.env" ]; then
    print_status "ok" "Backend .env file exists"
else
    print_status "error" "Backend .env file missing. Run: cd backend && cp .env.example .env"
fi

if [ -f "backend/prisma/schema.prisma" ]; then
    print_status "ok" "Prisma schema exists"
else
    print_status "error" "Prisma schema missing"
fi

# Check frontend files
if [ -f "package.json" ]; then
    print_status "ok" "Frontend package.json exists"
else
    print_status "error" "Frontend package.json missing"
fi

echo ""
echo "🔑 Checking Environment Configuration..."
echo ""

# Check for critical environment variables
if [ -f "backend/.env" ]; then
    if grep -q "GEMINI_API_KEY=\"AIza" backend/.env; then
        print_status "ok" "Gemini API Key configured"
    else
        print_status "warn" "Gemini API Key not set or using placeholder"
    fi

    if grep -q "JWT_SECRET=\"[a-f0-9]" backend/.env; then
        print_status "ok" "JWT Secret configured"
    else
        print_status "warn" "JWT Secret not set or using placeholder"
    fi

    if grep -q "DATABASE_URL=\"postgresql" backend/.env; then
        print_status "ok" "Database URL configured"
    else
        print_status "error" "Database URL not configured"
    fi
fi

echo ""
echo "📦 Checking Installed Dependencies..."
echo ""

# Check backend dependencies
if [ -d "backend/node_modules" ]; then
    print_status "ok" "Backend dependencies installed"
else
    print_status "warn" "Backend dependencies not installed. Run: cd backend && npm install"
fi

# Check frontend dependencies
if [ -d "node_modules" ]; then
    print_status "ok" "Frontend dependencies installed"
else
    print_status "warn" "Frontend dependencies not installed. Run: npm install"
fi

# Check Prisma Client
if [ -d "backend/node_modules/.prisma/client" ]; then
    print_status "ok" "Prisma Client generated"
else
    print_status "warn" "Prisma Client not generated. Run: cd backend && npx prisma generate"
fi

echo ""
echo "🗄️ Checking Database..."
echo ""

# Check if PostgreSQL is running (Docker)
if command -v docker &> /dev/null; then
    if docker ps | grep -q postgres; then
        print_status "ok" "PostgreSQL container running"
    else
        print_status "warn" "PostgreSQL container not running. Start with:"
        echo "   docker run -d --name neurobridge-postgres \\"
        echo "     -e POSTGRES_PASSWORD=password \\"
        echo "     -e POSTGRES_USER=user \\"
        echo "     -e POSTGRES_DB=neurobridge \\"
        echo "     -p 5432:5432 postgres:15"
    fi
fi

# Check migrations
if [ -d "backend/prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 backend/prisma/migrations | wc -l)
    print_status "ok" "Found $MIGRATION_COUNT migration(s)"
else
    print_status "warn" "No migrations directory found"
fi

echo ""
echo "📚 Checking Documentation..."
echo ""

if [ -f "QUICK_START.md" ]; then
    print_status "ok" "Quick Start guide available"
else
    print_status "warn" "QUICK_START.md missing"
fi

if [ -f "docs/GEMINI_AI_SETUP.md" ]; then
    print_status "ok" "Gemini AI setup guide available"
else
    print_status "warn" "AI setup documentation missing"
fi

if [ -f "docs/TESTING_GUIDE.md" ]; then
    print_status "ok" "Testing guide available"
else
    print_status "warn" "Testing guide missing"
fi

if [ -f "ROADMAP.md" ]; then
    print_status "ok" "Development roadmap available"
else
    print_status "warn" "ROADMAP.md missing"
fi

echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo -e "${GREEN}Success: $SUCCESS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Setup incomplete. Please fix errors above.${NC}"
    echo ""
    echo "Quick fixes:"
    echo "  1. Create .env: cd backend && cp .env.example .env"
    echo "  2. Install deps: cd backend && npm install"
    echo "  3. Start database: docker run -d --name neurobridge-postgres ..."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Setup mostly complete but has warnings.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. cd backend && npm install"
    echo "  2. cd backend && npx prisma migrate deploy"
    echo "  3. cd backend && npx prisma db seed"
    echo "  4. cd backend && npm run start:dev"
    exit 0
else
    echo -e "${GREEN}✅ All checks passed! You're ready to start.${NC}"
    echo ""
    echo "Start the platform:"
    echo "  Terminal 1: cd backend && npm run start:dev"
    echo "  Terminal 2: npm run dev"
    echo "  Browser: http://localhost:5173"
    exit 0
fi
