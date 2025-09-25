# WashikaDAO

A decentralized protocol on Stacks for marginalized communities, featuring governance, savings with PoX stacking, and trustless lending.

## 🌟 Features

### Governance
- **Token-based Voting**: WASHA token holders can create and vote on proposals
- **Delegation**: Delegate voting power to trusted community members
- **Timelock**: All governance changes go through a timelock for security
- **Proposal Lifecycle**: Complete proposal management from creation to execution

### Savings
- **STX Deposits**: Earn rewards by depositing STX into savings pools
- **PoX Stacking**: Optional automatic stacking to earn BTC rewards
- **sBTC Support**: Deposit and earn rewards on sBTC
- **Shares-based Accounting**: Fair reward distribution based on pool shares

### Lending
- **Collateralized Loans**: Borrow against STX and sBTC collateral
- **Dynamic Interest Rates**: Kink-based interest rate model
- **Liquidation System**: Automated liquidation of undercollateralized positions
- **Oracle Integration**: Real-time price feeds for accurate valuations

### Oracle System
- **Medianized Prices**: Multiple signers provide price data
- **Signature Verification**: Cryptographic verification of price submissions
- **Staleness Protection**: Automatic detection of outdated prices
- **Emergency Updates**: Guardian can update prices in emergencies

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Governance    │    │     Savings     │    │     Lending     │
│                 │    │                 │    │                 │
│ • DAO Core      │    │ • STX Pool      │    │ • Lending Core  │
│ • Timelock      │    │ • sBTC Pool     │    │ • Interest Model│
│ • WASHA Token   │    │ • PoX Stacking  │    │ • Liquidation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Cross-cutting │
                    │                 │
                    │ • Treasury      │
                    │ • Oracle        │
                    │ • Access Control│
                    └─────────────────┘
```

## 📁 Project Structure

```
washika-dao/
├── contracts/                 # Clarity smart contracts
│   ├── traits/               # Reusable contract traits
│   ├── governance-token.clar  # WASHA governance token
│   ├── washika-dao.clar      # Main DAO contract
│   ├── treasury.clar         # Treasury management
│   ├── savings-stx.clar      # STX savings pool
│   ├── savings-sbtc.clar     # sBTC savings pool
│   ├── lending-core.clar     # Lending protocol
│   ├── liquidation.clar      # Liquidation engine
│   └── oracle-aggregator.clar # Price oracle
├── tests/                    # Contract unit tests
├── frontend/                 # React frontend dApp
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   └── package.json
├── settings/                 # Clarinet settings
└── Clarinet.toml            # Clarinet configuration
```

## 🚀 Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) for smart contract development
- [Node.js](https://nodejs.org/) (v18+) for frontend development
- [Leather Wallet](https://leather.io/) or [Xverse](https://www.xverse.app/) for testing

### Smart Contracts

1. **Install Clarinet**:
   ```bash
   # macOS
   brew install clarinet
   
   # Or download from GitHub releases
   ```

2. **Run Tests**:
   ```bash
   clarinet test
   ```

3. **Check Contracts**:
   ```bash
   clarinet check
   ```

4. **Deploy to Testnet**:
   ```bash
   clarinet deploy --testnet
   ```

### Frontend dApp

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Contract Addresses

Update the contract addresses in `frontend/src/utils/stacks.ts` after deployment:

```typescript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_ADDRESS';
```

### Network Configuration

The frontend automatically detects the network based on the environment:
- Development: Stacks Testnet
- Production: Stacks Mainnet

## 📊 Key Contracts

### Governance Token (WASHA)
- **SIP-010 compliant** fungible token
- **Delegation system** for voting power
- **Checkpoint mechanism** for historical voting power queries
- **Mint/burn capabilities** controlled by DAO

### DAO Core
- **Proposal creation** with threshold requirements
- **Voting mechanism** with quorum checks
- **Timelock integration** for secure execution
- **State management** for proposal lifecycle

### Savings Pools
- **STX Pool**: Deposit STX, earn BTC rewards through PoX stacking
- **sBTC Pool**: Deposit sBTC, earn protocol rewards
- **Shares-based accounting** for fair reward distribution
- **Flexible stacking** with cycle management

### Lending Protocol
- **Multi-asset support** (STX, sBTC)
- **Overcollateralized loans** with configurable parameters
- **Dynamic interest rates** based on utilization
- **Automated liquidations** with oracle price feeds

### Oracle System
- **Multiple price feeds**: BTC/USD, STX/USD, sBTC/BTC
- **Signature-based verification** for data integrity
- **Median calculation** from multiple sources
- **Staleness detection** and emergency overrides

## 🛡️ Security Features

### Access Control
- **Role-based permissions** with DAO governance
- **Guardian system** for emergency actions
- **Timelock delays** for critical operations
- **Pause mechanisms** for emergency stops

### Economic Security
- **Collateralization ratios** to prevent bad debt
- **Liquidation incentives** for healthy markets
- **Reserve factors** for protocol sustainability
- **Interest rate bounds** to prevent manipulation

### Technical Security
- **Input validation** on all contract functions
- **Overflow protection** with safe math operations
- **Reentrancy guards** where applicable
- **Comprehensive test coverage**

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
clarinet test

# Run specific test file
clarinet test tests/governance-token_test.ts
```

### Integration Tests
```bash
# Test contract interactions
clarinet test tests/integration_test.ts
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📈 Monitoring & Analytics

### On-chain Metrics
- Total Value Locked (TVL)
- Active proposals and voting participation
- Stacking rewards and APY
- Lending utilization rates
- Liquidation events

### Price Feeds
- Real-time STX/USD pricing
- BTC/USD for reward calculations
- sBTC/BTC peg monitoring
- Historical price data

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow Clarity best practices
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs.washikadao.org](https://docs.washikadao.org)
- **Stacks Documentation**: [docs.stacks.co](https://docs.stacks.co)
- **Hiro Documentation**: [docs.hiro.so](https://docs.hiro.so)
- **Community Discord**: [discord.gg/washikadao](https://discord.gg/washikadao)

## 🙏 Acknowledgments

- **Stacks Foundation** for the blockchain infrastructure
- **Hiro Systems** for development tools and APIs
- **Community contributors** for feedback and testing
- **Marginalized communities** for inspiring this protocol

---

**Built with ❤️ for marginalized communities on Stacks**
