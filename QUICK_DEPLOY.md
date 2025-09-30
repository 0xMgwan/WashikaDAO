# 🚀 Quick Deploy Guide for WashikaDAO

## Current Status: ⚠️ **Contracts Not Deployed**

The frontend buttons aren't working because the smart contracts haven't been deployed yet. Here's how to fix this:

## 📋 **Prerequisites**

1. **Install Clarinet** (Stacks smart contract development tool)
   ```bash
   # Option 1: Using Homebrew (recommended)
   brew install clarinet
   
   # Option 2: Using curl
   curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-macos-x64.tar.gz | tar xz
   sudo mv clarinet /usr/local/bin/
   ```

2. **Get STX Tokens**
   - Go to [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet)
   - Get testnet STX for deployment costs

3. **Set up Stacks Wallet**
   - Install [Leather Wallet](https://leather.io/) or [Xverse](https://xverse.app/)
   - Switch to Testnet mode

## 🔧 **Deployment Steps**

### **Step 1: Test Contracts Locally**
```bash
# In the project root
clarinet console

# In the console, test basic functionality:
::deploy_contracts
(contract-call? .governance-token mint tx-sender u1000000000)
```

### **Step 2: Deploy to Testnet**
```bash
# Generate deployment plan
clarinet deployments generate --testnet

# Deploy contracts (requires STX in wallet)
clarinet deployments apply --testnet
```

### **Step 3: Update Frontend Configuration**
After deployment, update `frontend/.env.local` with contract addresses:
```env
VITE_CONTRACTS_DEPLOYED=true
VITE_GOVERNANCE_CONTRACT_ADDRESS=ST1234...GOVERNANCE
VITE_SAVINGS_STX_CONTRACT_ADDRESS=ST1234...SAVINGS
VITE_LENDING_CORE_CONTRACT_ADDRESS=ST1234...LENDING
# ... etc
```

## 🎯 **Quick Demo Mode (Current)**

For now, the frontend works in **demo mode** with:
- ✅ **Navigation buttons** - redirect to respective pages
- ✅ **Mock data** - shows realistic numbers
- ✅ **UI interactions** - buttons show alerts explaining the status
- ✅ **Responsive design** - fully functional interface

## 🔄 **What Each Button Does Now:**

| Button | Current Behavior | After Deployment |
|--------|------------------|------------------|
| **Connect Wallet** | Shows alert about deployment status | Connects to Stacks wallet |
| **Start Saving Today** | Redirects to `/savings` page | Opens deposit modal |
| **Join Governance** | Redirects to `/governance` page | Shows active proposals |
| **Explore Lending** | Redirects to `/lending` page | Shows lending markets |

## 🛠️ **Alternative: Use Devnet**

For faster development, you can use local devnet:

```bash
# Start local blockchain
clarinet integrate

# In another terminal
cd frontend
npm run dev
```

Then update `.env.local`:
```env
VITE_STACKS_NETWORK=devnet
VITE_STACKS_API_URL=http://localhost:3999
```

## 📞 **Need Help?**

1. **Check contract syntax**: `clarinet check`
2. **Run tests**: `clarinet test`
3. **View deployment status**: Check [Stacks Explorer](https://explorer.stacks.co/?chain=testnet)
4. **Debug issues**: Look at browser console for errors

## 🎉 **Once Deployed**

After successful deployment:
1. ✅ All buttons will work with real blockchain interactions
2. ✅ Wallet connection will be functional
3. ✅ Real-time data from contracts
4. ✅ Actual STX/BTC transactions
5. ✅ Live governance voting

The UI is already fully built and ready - we just need the contracts deployed!
