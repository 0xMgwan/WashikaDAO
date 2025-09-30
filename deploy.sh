#!/bin/bash

# WashikaDAO Automated Deployment Script
# This script will deploy all contracts to Stacks testnet

echo "🚀 WashikaDAO Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Use local stacks CLI
STX_CLI="npx @stacks/cli"

# Check if stacks CLI is installed locally
if [ ! -d "node_modules/@stacks/cli" ]; then
    echo -e "${RED}❌ Stacks CLI not found${NC}"
    echo "Installing Stacks CLI locally..."
    npm install @stacks/cli
fi

# Check for wallet configuration
if [ ! -f ".env.deploy" ]; then
    echo -e "${RED}❌ Deployment configuration not found${NC}"
    echo ""
    echo "Please create .env.deploy with your wallet details:"
    echo ""
    echo "STACKS_PRIVATE_KEY=your_private_key_here"
    echo "STACKS_NETWORK=testnet"
    echo ""
    exit 1
fi

# Load environment variables
source .env.deploy

echo -e "${BLUE}📋 Deployment Plan:${NC}"
echo "Network: $STACKS_NETWORK"
echo ""

# Array of contracts to deploy in order
declare -a TRAITS=(
    "contracts/traits/sip010-ft-trait.clar:sip010-ft-trait"
    "contracts/traits/oracle-price-trait.clar:oracle-price-trait"
    "contracts/traits/dao-governable-trait.clar:dao-governable-trait"
    "contracts/traits/market-trait.clar:market-trait"
)

declare -a CORE_CONTRACTS=(
    "contracts/governance-token.clar:governance-token"
    "contracts/washika-dao.clar:washika-dao"
    "contracts/timelock.clar:timelock"
    "contracts/treasury.clar:treasury"
)

declare -a POOL_CONTRACTS=(
    "contracts/community-pool.clar:community-pool"
    "contracts/savings-stx.clar:savings-stx"
    "contracts/savings-sbtc.clar:savings-sbtc"
    "contracts/stacking-strategy.clar:stacking-strategy"
)

declare -a LENDING_CONTRACTS=(
    "contracts/interest-model-kink.clar:interest-model-kink"
    "contracts/lending-core.clar:lending-core"
    "contracts/liquidation.clar:liquidation"
    "contracts/oracle-aggregator.clar:oracle-aggregator"
)

# Function to deploy a contract
deploy_contract() {
    local contract_path=$1
    local contract_name=$2
    
    echo -e "${BLUE}Deploying $contract_name...${NC}"
    
    # Stacks CLI format: deploy_contract SOURCE_FILE CONTRACT_NAME FEE NONCE PAYMENT_KEY
    $STX_CLI deploy_contract \
        "$contract_path" \
        "$contract_name" \
        10000 \
        0 \
        "$STACKS_PRIVATE_KEY"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $contract_name deployed successfully${NC}"
        echo ""
    else
        echo -e "${RED}❌ Failed to deploy $contract_name${NC}"
        exit 1
    fi
    
    # Wait a bit between deployments
    sleep 5
}

# Deploy traits first
echo -e "${BLUE}📦 Phase 1: Deploying Traits${NC}"
echo ""
for contract in "${TRAITS[@]}"; do
    IFS=':' read -r path name <<< "$contract"
    deploy_contract "$path" "$name"
done

# Deploy core contracts
echo -e "${BLUE}📦 Phase 2: Deploying Core Contracts${NC}"
echo ""
for contract in "${CORE_CONTRACTS[@]}"; do
    IFS=':' read -r path name <<< "$contract"
    deploy_contract "$path" "$name"
done

# Deploy pool contracts
echo -e "${BLUE}📦 Phase 3: Deploying Pool Contracts${NC}"
echo ""
for contract in "${POOL_CONTRACTS[@]}"; do
    IFS=':' read -r path name <<< "$contract"
    deploy_contract "$path" "$name"
done

# Deploy lending contracts
echo -e "${BLUE}📦 Phase 4: Deploying Lending Contracts${NC}"
echo ""
for contract in "${LENDING_CONTRACTS[@]}"; do
    IFS=':' read -r path name <<< "$contract"
    deploy_contract "$path" "$name"
done

echo ""
echo -e "${GREEN}🎉 All contracts deployed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Check your deployments at: https://explorer.stacks.co/?chain=testnet"
echo "2. Update frontend/.env.local with contract addresses"
echo "3. Restart the frontend: cd frontend && npm run dev"
echo ""
