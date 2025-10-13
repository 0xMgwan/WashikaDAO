# WashikaDAO

A decentralized protocol on Stacks for marginalized communities, featuring governance, community pools, and savings with PoX stacking.

## 🌟 Features

### ✅ **Governance (Live on Testnet)**
- **Pool-based Governance**: Pool members can create and vote on proposals
- **STX-based Voting**: Voting power based on STX balance (1 STX = 1 vote)
- **Simple Proposals**: Three types - Fund Allocation, Pool Parameters, General
- **Contract**: `STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.simple-governance`

### ✅ **Community Pools (Live on Testnet)**
- **Pool Factory**: Create and manage community savings pools
- **Member Contributions**: Join pools and contribute STX
- **Pool Governance**: Members can create proposals for their pools
- **Contract**: `STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.pool-factory-v3`
- **Proposal Lifecycle**: Complete proposal management from creation to execution

### Savings
- **STX Deposits**: Earn rewards by depositing STX into savings pools
- **PoX Stacking**: Optional automatic stacking to earn BTC rewards
- **sBTC Support**: Deposit and earn rewards on sBTC
- **Shares-based Accounting**: Fair reward distribution based on pool shares

### 🚧 **In Development**
- **Savings Pools**: STX deposits with PoX stacking rewards
- **Lending Protocol**: Collateralized loans against STX/sBTC
- **Oracle System**: Price feeds for accurate valuations

## 🚀 **Quick Start**

### **Frontend Development**
```bash
cd frontend
npm install
npm run dev
```

### **Deploy Contracts**
```bash
# Deploy governance contract
export STACKS_PRIVATE_KEY=your_private_key
node deploy-governance.js

# Deploy pool factory
node deploy-pool.js "Pool Name" 5 7 10
```

## 📁 **Project Structure**

```
washika-dao/
├── contracts/                 # Clarity smart contracts
│   ├── simple-governance.clar # Governance contract (LIVE)
│   ├── community-pool-v2.clar # Pool contract (LIVE)
│   └── pool-factory-v3.clar  # Pool factory (LIVE)
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/           # App pages
│   │   ├── hooks/           # React hooks
│   │   └── utils/           # Utilities
├── deploy-governance.js       # Deploy governance
└── deploy-pool.js            # Deploy pools
```

## 🌐 **Live Contracts (Stacks Testnet)**

- **Governance**: [STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.simple-governance](https://explorer.stacks.co/address/STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.simple-governance?chain=testnet)
- **Pool Factory**: [STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.pool-factory-v3](https://explorer.stacks.co/address/STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.pool-factory-v3?chain=testnet)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.
