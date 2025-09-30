#!/bin/bash

# Database Backup Script for Tastebase Development
# Creates timestamped backups of the current database

set -e

echo "💾 Starting database backup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_FILE="tastebase.db"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/tastebase_${TIMESTAMP}.db"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}❌ Database file '$DB_FILE' not found${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
echo -e "${YELLOW}📋 Creating backup: $BACKUP_FILE${NC}"
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created successfully${NC}"
    
    # Get file sizes
    ORIGINAL_SIZE=$(ls -lh "$DB_FILE" | awk '{print $5}')
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    
    echo ""
    echo -e "${YELLOW}📊 Backup Details:${NC}"
    echo "   • Original: $DB_FILE ($ORIGINAL_SIZE)"
    echo "   • Backup: $BACKUP_FILE ($BACKUP_SIZE)"
    echo "   • Timestamp: $TIMESTAMP"
    
    # Show recent backups
    echo ""
    echo -e "${YELLOW}📚 Recent Backups:${NC}"
    ls -lht "$BACKUP_DIR"/ | head -6 | tail -5 | awk '{print "   • " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
    
    # Cleanup old backups (keep last 10)
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/ | wc -l)
    if [ "$BACKUP_COUNT" -gt 10 ]; then
        echo ""
        echo -e "${YELLOW}🧹 Cleaning up old backups (keeping 10 most recent)...${NC}"
        ls -t "$BACKUP_DIR"/tastebase_*.db | tail -n +11 | xargs rm -f
        echo -e "${GREEN}✅ Cleanup completed${NC}"
    fi
    
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Database backup complete!${NC}"