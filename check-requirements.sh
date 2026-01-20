#!/bin/bash

# Pre-installation checker for WordPress Automation

echo "=========================================="
echo "WordPress Automation - Pre-Installation Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

READY=true

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ Installed${NC} ($DOCKER_VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Install: https://docs.docker.com/get-docker/"
    READY=false
fi

# Check Docker Compose
echo -n "Checking Docker Compose... "
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
    else
        COMPOSE_VERSION=$(docker compose version)
    fi
    echo -e "${GREEN}✓ Installed${NC} ($COMPOSE_VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Install: https://docs.docker.com/compose/install/"
    READY=false
fi

# Check Docker daemon
echo -n "Checking Docker daemon... "
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo "  Start: sudo systemctl start docker"
    READY=false
fi

# Check htpasswd (for password generation)
echo -n "Checking htpasswd... "
if command -v htpasswd &> /dev/null; then
    echo -e "${GREEN}✓ Available${NC}"
else
    echo -e "${YELLOW}⚠ Not installed${NC}"
    echo "  Will be installed during setup"
fi

# Check openssl (for certificate generation)
echo -n "Checking openssl... "
if command -v openssl &> /dev/null; then
    echo -e "${GREEN}✓ Available${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Install: apt-get install openssl"
    READY=false
fi

# Check ports
echo ""
echo "Checking required ports..."

check_port() {
    PORT=$1
    if netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
        echo -e "  Port $PORT: ${YELLOW}⚠ In use${NC}"
        echo "    You may need to stop the service using this port"
        return 1
    else
        echo -e "  Port $PORT: ${GREEN}✓ Available${NC}"
        return 0
    fi
}

check_port 80
check_port 443
check_port 3000

# Check domain DNS (optional)
echo ""
echo -n "Checking domain DNS (wp.vjgp.online)... "
if command -v nslookup &> /dev/null; then
    if nslookup wp.vjgp.online &> /dev/null; then
        IP=$(nslookup wp.vjgp.online | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        echo -e "${GREEN}✓ Resolves to $IP${NC}"
    else
        echo -e "${YELLOW}⚠ Cannot resolve${NC}"
        echo "  Make sure DNS is configured to point to this server"
    fi
else
    echo -e "${YELLOW}⚠ Cannot check (nslookup not available)${NC}"
fi

# Check disk space
echo ""
echo -n "Checking disk space... "
AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${GREEN}✓ Available: $AVAILABLE${NC}"

# Summary
echo ""
echo "=========================================="
if [ "$READY" = true ]; then
    echo -e "${GREEN}✓ System is ready for installation!${NC}"
    echo ""
    echo "Next step: Run ./setup.sh"
else
    echo -e "${RED}✗ Please fix the issues above before installation${NC}"
fi
echo "=========================================="
echo ""

# Additional reminders
echo "Before running setup, make sure you have:"
echo "  □ WordPress site URL and credentials"
echo "  □ WordPress Application Password (or can generate one)"
echo "  □ OpenAI API key (or account to create one)"
echo "  □ Domain wp.vjgp.online pointing to this server"
echo ""
