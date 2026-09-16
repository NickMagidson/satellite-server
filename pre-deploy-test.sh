#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Pre-Deploy Test Suite for Railway${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FAILED=0

run_test() {
    local test_name="$1"
    local test_number="$2"
    shift 2
    
    echo -e "${YELLOW}${test_number} ${test_name}...${NC}"
    
    if "$@"; then
        echo -e "${GREEN}✅ ${test_name} passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
        echo ""
        FAILED=1
        return 1
    fi
}

echo -e "${BLUE}Step 1: Type Checking${NC}"
run_test "TypeScript type check" "1️⃣ " npm run typecheck

echo -e "${BLUE}Step 2: Running Tests${NC}"
run_test "API tests" "2️⃣ " npm --workspace apps/api run test
run_test "Frontend tests" "2️⃣ " npm --workspace apps/frontend run test

echo -e "${BLUE}Step 3: Linting${NC}"
run_test "Frontend linting" "3️⃣ " npm --workspace apps/frontend run lint

echo -e "${BLUE}Step 4: Code Formatting Check${NC}"
run_test "Prettier format check" "4️⃣ " npm --workspace apps/frontend run check

echo -e "${BLUE}Step 5: Production Build${NC}"
run_test "Prisma client generation" "5️⃣ " npm run db:generate
run_test "Production build (API + Frontend)" "5️⃣ " npm run build

echo -e "${BLUE}Step 6: Verify Build Artifacts${NC}"
if [ -d "apps/api/dist" ] && [ -n "$(ls -A apps/api/dist)" ]; then
    echo -e "${GREEN}✅ API build artifacts exist${NC}"
else
    echo -e "${RED}❌ API build artifacts missing${NC}"
    FAILED=1
fi

if [ -d "apps/frontend/dist" ] && [ -n "$(ls -A apps/frontend/dist)" ]; then
    echo -e "${GREEN}✅ Frontend build artifacts exist${NC}"
else
    echo -e "${RED}❌ Frontend build artifacts missing${NC}"
    FAILED=1
fi
echo ""

echo -e "${BLUE}Step 7: Docker Build Tests${NC}"
echo -e "${YELLOW}7️⃣  Building API Docker image (target: api-runtime)...${NC}"
if docker build --target api-runtime -t satellite-api:test . > /tmp/api-build.log 2>&1; then
    echo -e "${GREEN}✅ API Docker build successful${NC}"
else
    echo -e "${RED}❌ API Docker build failed. Check /tmp/api-build.log for details${NC}"
    FAILED=1
fi
echo ""

echo -e "${YELLOW}7️⃣  Building Frontend Docker image (target: frontend-runtime)...${NC}"
if [ -z "$VITE_CESIUM_ION_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: VITE_CESIUM_ION_ACCESS_TOKEN not set${NC}"
    echo -e "${YELLOW}   Using placeholder token for build test${NC}"
    VITE_CESIUM_ION_ACCESS_TOKEN="placeholder_for_build_test"
fi

if docker build --target frontend-runtime \
    --build-arg VITE_API_URL=http://localhost:3000 \
    --build-arg VITE_CESIUM_ION_ACCESS_TOKEN="${VITE_CESIUM_ION_ACCESS_TOKEN}" \
    -t satellite-frontend:test . > /tmp/frontend-build.log 2>&1; then
    echo -e "${GREEN}✅ Frontend Docker build successful${NC}"
else
    echo -e "${RED}❌ Frontend Docker build failed. Check /tmp/frontend-build.log for details${NC}"
    FAILED=1
fi
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All pre-deploy tests passed!${NC}"
    echo -e "${GREEN}   Ready for Railway deployment${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${RED}   Please fix issues before deploying${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
