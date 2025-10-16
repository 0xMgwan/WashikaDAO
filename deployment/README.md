# WashikaDAO Deployment Guide

This directory contains the unified deployment system for all WashikaDAO contracts.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Stacks private key with STX for deployment fees
- Access to Stacks testnet or mainnet

### Setup Environment
```bash
# Set your private key (required)
export STACKS_PRIVATE_KEY="your_private_key_here"

# Optional: Set network (defaults to testnet)
export STACKS_NETWORK="testnet"  # or "mainnet"
```

## 📋 Available Commands

### Deploy Individual Contracts

```bash
# Deploy governance contract
node deploy.js governance

# Deploy STX savings contract
node deploy.js savings

# Deploy pool factory contract
node deploy.js pool-factory

# Deploy individual community pool
node deploy.js pool "Village Pool" 5 7 10
# Args: name, contribution_stx, cycle_days, max_members
```

### Deploy All Core Contracts
```bash
# Deploy governance, savings, and pool factory in one command
node deploy.js all
```

### Get Help
```bash
# Show all available commands and usage
node deploy.js
```

## 📁 File Structure

```
deployment/
├── deploy.js           # Main deployment script
├── deployments.json    # Generated deployment info (gitignored)
└── README.md          # This file
```

## 🔧 How It Works

### Contract Deployment Process
1. **Reads contract code** from `../contracts/` directory
2. **Creates deployment transaction** with proper fees and settings
3. **Broadcasts to Stacks network** (testnet by default)
4. **Updates frontend configuration** automatically
5. **Saves deployment info** to `deployments.json`

### Frontend Integration
The deployment script automatically updates the frontend configuration file:
- Updates contract addresses in `../frontend/src/utils/stacks.ts`
- Ensures frontend uses the latest deployed contracts
- No manual configuration needed

### Deployment Artifacts
- **deployments.json**: Contains all deployment information
- **Transaction IDs**: For tracking on Stacks explorer
- **Contract addresses**: Full addresses for each deployed contract
- **Deployment timestamps**: When each contract was deployed

## 🛡️ Security Features

### Private Key Handling
- Private keys are **never stored** in files
- Must be provided via environment variable
- Script exits if private key is missing

### Network Safety
- Defaults to **testnet** for safety
- Clear network indication in all outputs
- Explorer links for transaction verification

### Error Handling
- Comprehensive error messages
- Automatic retry logic for network issues
- Graceful failure with cleanup

## 📊 Example Deployment Output

```
🚀 DEPLOYING ALL WASHIKADAO CONTRACTS
=====================================

1️⃣ Deploying Governance Contract...
🚀 Deploying simple-governance...
✅ SUCCESS!
📍 Contract: STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.simple-governance
🔗 TX: 42d15365b9437ff647844869d684eab2018b370eab43357dabc512ec389ada35
🌐 Explorer: https://explorer.stacks.co/txid/42d15365...?chain=testnet
✅ Frontend configuration updated!

2️⃣ Deploying Savings Contract...
🚀 Deploying savings-stx-v4...
✅ SUCCESS!
📍 Contract: 27b06e0bdf21fa430cbe079f1b010bdcd1bf84e6.savings-stx-v4
🔗 TX: dd9b962aab043cdb2ef4f604dba48a3d1bb47ddae85104e2ee0af412751bf75d
🌐 Explorer: https://explorer.stacks.co/txid/dd9b962a...?chain=testnet
✅ Frontend configuration updated!

💾 Deployment info saved to deployments.json

🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!
======================================
✅ Governance: STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.simple-governance
✅ Savings: 27b06e0bdf21fa430cbe079f1b010bdcd1bf84e6.savings-stx-v4
✅ Pool Factory: STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.pool-factory-v3
```

## 🔍 Troubleshooting

### Common Issues

**"STACKS_PRIVATE_KEY not set"**
```bash
export STACKS_PRIVATE_KEY="your_private_key_here"
```

**"Insufficient funds"**
- Ensure your account has enough STX for deployment fees
- Get testnet STX from: https://explorer.stacks.co/sandbox/faucet

**"Contract already exists"**
- Contract names must be unique per deployer
- Use different contract names or deploy from different account

**"Network timeout"**
- Stacks network may be congested
- Wait a few minutes and retry
- Check Stacks status: https://status.stacks.co/

### Getting Help
- Check the [main README](../README.md) for project overview
- Review [contract documentation](../docs/) for technical details
- Open an issue on GitHub for deployment problems

## 🔄 Migration from Old Scripts

If you were using the old deployment scripts:

### Old Way ❌
```bash
node deploy-governance.js
node deploy-pool.js "Pool" 5 7 10
node deploy-savings.js
node update-frontend-config.js
```

### New Way ✅
```bash
node deployment/deploy.js all
# or individually:
node deployment/deploy.js governance
node deployment/deploy.js pool "Pool" 5 7 10
node deployment/deploy.js savings
```

### Benefits of New System
- **Single script** for all deployments
- **Automatic frontend updates** (no separate config script)
- **Unified deployment tracking** in one JSON file
- **Better error handling** and user feedback
- **Consistent CLI interface** across all contracts

---

**Built for WashikaDAO - Empowering marginalized communities through decentralized finance**
