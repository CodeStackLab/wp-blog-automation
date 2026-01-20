#!/bin/bash

# Automated Setup for WordPress Automation with Traefik Integration
# This script integrates with your existing Traefik setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

clear
echo -e "${BLUE}"
echo "=========================================="
echo "  WordPress Automation - Auto Setup"
echo "=========================================="
echo -e "${NC}"
echo ""
echo "This will set up WordPress automation with:"
echo "  ✓ Automatic SSL via your existing Traefik"
echo "  ✓ Password protection (HTTP Basic Auth)"
echo "  ✓ AI article generation with ChatGPT"
echo "  ✓ WordPress publishing automation"
echo ""
echo -e "${GREEN}Domain: wp.vjgp.online${NC}"
echo ""

# Check if Traefik is running
if ! docker ps | grep -q traefik; then
    echo -e "${RED}Error: Traefik is not running${NC}"
    echo "Please start your n8n setup first"
    exit 1
fi

echo -e "${GREEN}✓ Traefik detected and running${NC}"
echo ""

# Step 1: Set up HTTP Basic Auth
echo -e "${YELLOW}Step 1: HTTP Basic Auth Setup${NC}"
echo "This adds password protection to your subdomain"
echo ""

read -p "Enter username for access (default: wpuser): " HTTP_USER
HTTP_USER=${HTTP_USER:-wpuser}

read -sp "Enter password for access: " HTTP_PASS
echo ""

# Install htpasswd if needed
if ! command -v htpasswd &> /dev/null; then
    echo "Installing apache2-utils..."
    apt-get update -qq && apt-get install -y apache2-utils > /dev/null 2>&1
fi

# Generate htpasswd hash for Traefik
BASIC_AUTH_USERS=$(htpasswd -nb "$HTTP_USER" "$HTTP_PASS")
echo -e "${GREEN}✓ HTTP Basic Auth configured${NC}"
echo ""

# Step 2: Set up application admin credentials
echo -e "${YELLOW}Step 2: Application Admin Setup${NC}"
echo "These are the credentials to login to the app"
echo ""

read -p "Enter admin username (default: admin): " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

read -sp "Enter admin password: " ADMIN_PASS
echo ""

# Generate random session secret
SESSION_SECRET=$(openssl rand -base64 32)

echo -e "${GREEN}✓ Admin credentials configured${NC}"
echo ""

# Step 3: Create .env file
echo -e "${YELLOW}Step 3: Creating configuration...${NC}"

cat > .env <<EOF
# Application Settings
NODE_ENV=production
SESSION_SECRET=$SESSION_SECRET

# Admin Credentials
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS

# Traefik Basic Auth (htpasswd format)
BASIC_AUTH_USERS=$BASIC_AUTH_USERS

# Domain
DOMAIN=wp.vjgp.online
EOF

echo -e "${GREEN}✓ Configuration created${NC}"
echo ""

# Step 4: Build and start
echo -e "${YELLOW}Step 4: Building and starting application...${NC}"
echo ""

# Build the Docker image
echo "Building Docker image..."
docker compose build --no-cache

# Start the container
echo "Starting container..."
docker compose up -d

# Wait for container to be healthy
echo "Waiting for application to start..."
sleep 5

# Check if container is running
if docker ps | grep -q wp_automation_app; then
    echo -e "${GREEN}✓ Application started successfully${NC}"
else
    echo -e "${RED}✗ Application failed to start${NC}"
    echo "Check logs: docker compose logs"
    exit 1
fi

echo ""
echo -e "${GREEN}"
echo "=========================================="
echo "  ✓ Setup Complete!"
echo "=========================================="
echo -e "${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo ""
echo -e "  URL: ${GREEN}https://wp.vjgp.online${NC}"
echo ""
echo -e "${BLUE}Login Credentials:${NC}"
echo ""
echo "  1st Layer - HTTP Basic Auth:"
echo "     Username: $HTTP_USER"
echo "     Password: [the password you entered]"
echo ""
echo "  2nd Layer - Application Login:"
echo "     Username: $ADMIN_USER"
echo "     Password: [the password you entered]"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "  1. Open https://wp.vjgp.online in your browser"
echo "  2. Login with your credentials (2 layers)"
echo "  3. Go to Settings and configure:"
echo "     • WordPress site URL and credentials"
echo "     • OpenAI API key"
echo "  4. Test connections"
echo "  5. Generate your first article!"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo ""
echo "  View logs:     docker compose logs -f"
echo "  Stop app:      docker compose down"
echo "  Restart app:   docker compose restart"
echo "  Check status:  docker compose ps"
echo ""
echo -e "${GREEN}Your WordPress automation is now live! 🚀${NC}"
echo ""
