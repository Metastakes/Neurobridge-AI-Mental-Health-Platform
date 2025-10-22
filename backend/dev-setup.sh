#!/bin/bash
# NeuroBridge Backend Development Setup Script
# This script sets up the backend environment for local development

set -e  # Exit on error

echo "🏥 NeuroBridge Backend Setup"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the backend directory${NC}"
    exit 1
fi

# Step 1: Check Node.js version
echo -e "\n${YELLOW}1. Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18 or higher is required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK${NC}"

# Step 2: Install dependencies
echo -e "\n${YELLOW}2. Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Setup environment file
echo -e "\n${YELLOW}3. Setting up environment file...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env

    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-in-production-$(date +%s)")

    # Update .env with generated values
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|your-super-secret-jwt-key-change-in-production|$JWT_SECRET|g" .env
    else
        # Linux
        sed -i "s|your-super-secret-jwt-key-change-in-production|$JWT_SECRET|g" .env
    fi

    echo -e "${GREEN}✓ .env file created with generated JWT secret${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your actual API keys for:${NC}"
    echo "  - GEMINI_API_KEY (for AI features)"
    echo "  - GOOGLE_APPLICATION_CREDENTIALS (for Calendar/Meet)"
    echo "  - STRIPE_SECRET_KEY (for billing)"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 4: Check PostgreSQL
echo -e "\n${YELLOW}4. Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL client found${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL client not found. Install PostgreSQL or use Docker:${NC}"
    echo "  docker run -d --name neurobridge-postgres \\"
    echo "    -e POSTGRES_PASSWORD=password \\"
    echo "    -e POSTGRES_USER=user \\"
    echo "    -e POSTGRES_DB=neurobridge \\"
    echo "    -p 5432:5432 postgres:15"
fi

# Step 5: Test database connection
echo -e "\n${YELLOW}5. Testing database connection...${NC}"
if npx prisma db execute --stdin <<< "SELECT 1" &>/dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo -e "${YELLOW}Please ensure PostgreSQL is running and DATABASE_URL in .env is correct${NC}"
    echo -e "${YELLOW}Starting PostgreSQL with Docker? Run:${NC}"
    echo "  docker run -d --name neurobridge-postgres \\"
    echo "    -e POSTGRES_PASSWORD=password \\"
    echo "    -e POSTGRES_USER=user \\"
    echo "    -e POSTGRES_DB=neurobridge \\"
    echo "    -p 5432:5432 postgres:15"
    exit 1
fi

# Step 6: Run migrations
echo -e "\n${YELLOW}6. Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations completed${NC}"

# Step 7: Seed database (optional)
echo -e "\n${YELLOW}7. Seeding database...${NC}"
read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db seed
    echo -e "${GREEN}✓ Database seeded${NC}"
else
    echo -e "${YELLOW}Skipped database seeding${NC}"
fi

# Step 8: Generate Prisma Client
echo -e "\n${YELLOW}8. Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

echo -e "\n${GREEN}=============================="
echo "✓ Setup Complete!"
echo "==============================${NC}"
echo
echo "To start the development server:"
echo -e "  ${GREEN}npm run start:dev${NC}"
echo
echo "API will be available at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo
echo "API Documentation (Swagger):"
echo -e "  ${GREEN}http://localhost:3000/api${NC}"
echo
echo "Database Studio (Prisma):"
echo -e "  ${GREEN}npx prisma studio${NC}"
echo
