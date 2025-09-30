#!/bin/bash

# Database Reset Script for Tastebase Development
# Completely resets the database and applies fresh migrations with seed data

set -e

echo "🗄️  Starting database reset..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if database file exists
DB_FILE="tastebase.db"
if [ -f "$DB_FILE" ]; then
    echo -e "${YELLOW}📋 Backing up current database...${NC}"
    cp "$DB_FILE" "${DB_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Database backed up${NC}"
    
    echo -e "${YELLOW}🗑️  Removing existing database...${NC}"
    rm "$DB_FILE"
    echo -e "${GREEN}✅ Database removed${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing database found${NC}"
fi

# Run migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
pnpm run db:migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Run seeding
echo -e "${YELLOW}🌱 Seeding database with sample data...${NC}"
pnpm run db:seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${RED}❌ Seeding failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Database reset complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Database Status:${NC}"
echo "   • Database file: $DB_FILE"
echo "   • Backup available in current directory"
echo "   • Fresh migrations applied"
echo "   • Sample recipe data loaded"
echo ""
echo -e "${YELLOW}🚀 Ready for development!${NC}"