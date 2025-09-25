# WashikaDAO Deployment Guide

This guide covers deploying WashikaDAO smart contracts and frontend to various environments.

## 📋 Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) installed
- [Node.js](https://nodejs.org/) v18+ installed
- Stacks wallet (Leather or Xverse) for testnet deployment
- STX tokens for deployment costs

## 🔧 Smart Contract Deployment

### Local Development

1. **Start Clarinet Console**
   ```bash
   clarinet console
   ```

2. **Deploy Contracts**
   ```clarity
   ::deploy_contracts
   ```

3. **Test Contract Interactions**
   ```clarity
   (contract-call? .governance-token mint tx-sender u1000000000)
   ```

### Testnet Deployment

1. **Configure Testnet Settings**
   ```bash
   clarinet deployments generate --testnet
   ```

2. **Update Contract Addresses**
   Edit `deployments/testnet-deployment-plan.yaml` with your addresses.

3. **Deploy to Testnet**
   ```bash
   clarinet deployments apply --testnet
   ```

4. **Verify Deployment**
   Check contracts on [Stacks Explorer](https://explorer.stacks.co/?chain=testnet)

### Mainnet Deployment

⚠️ **Warning**: Mainnet deployment requires real STX and is irreversible.

1. **Audit Contracts**
   - Complete security audit
   - Test thoroughly on testnet
   - Review all contract parameters

2. **Configure Mainnet**
   ```bash
   clarinet deployments generate --mainnet
   ```

3. **Deploy to Mainnet**
   ```bash
   clarinet deployments apply --mainnet
   ```

## 🌐 Frontend Deployment

### Environment Configuration

1. **Create Environment Files**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Update Contract Addresses**
   ```env
   VITE_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
   VITE_NETWORK=testnet
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

### Netlify Deployment

1. **Build Project**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Custom Server Deployment

1. **Build for Production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve Static Files**
   ```bash
   npm install -g serve
   serve -s dist -l 3000
   ```

## 🔐 Security Considerations

### Smart Contracts
- [ ] All contracts audited
- [ ] Access controls properly configured
- [ ] Emergency pause mechanisms tested
- [ ] Oracle price feeds validated
- [ ] Timelock delays appropriate

### Frontend
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Content Security Policy configured
- [ ] No sensitive data in client code
- [ ] Wallet connections secure

## 📊 Post-Deployment Checklist

### Smart Contracts
- [ ] Verify contract addresses
- [ ] Test all major functions
- [ ] Configure governance parameters
- [ ] Set up oracle price feeds
- [ ] Initialize treasury

### Frontend
- [ ] Test wallet connectivity
- [ ] Verify contract interactions
- [ ] Check responsive design
- [ ] Test all user flows
- [ ] Monitor error tracking

## 🔄 Upgrade Process

### Smart Contract Upgrades
WashikaDAO contracts are designed to be upgradeable through governance:

1. **Create Upgrade Proposal**
   ```clarity
   (contract-call? .washika-dao propose 
     (list .new-contract-address)
     (list u0)
     (list "upgrade-contract")
     (list 0x...)
     "Upgrade contract to v2.0")
   ```

2. **Community Voting**
   - Proposal discussion period
   - Voting period (7 days)
   - Execution through timelock

3. **Execute Upgrade**
   ```clarity
   (contract-call? .timelock execute-transaction ...)
   ```

### Frontend Updates
- Use CI/CD for automated deployments
- Implement feature flags for gradual rollouts
- Monitor performance and errors
- Rollback capability for critical issues

## 📈 Monitoring & Maintenance

### Contract Monitoring
- Track transaction volumes
- Monitor oracle price feeds
- Watch for liquidation events
- Check governance participation

### Frontend Monitoring
- User analytics
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

## 🆘 Emergency Procedures

### Contract Issues
1. **Pause Protocol**
   ```clarity
   (contract-call? .washika-dao set-paused true)
   ```

2. **Emergency Governance**
   - Guardian can pause contracts
   - Emergency proposals for critical fixes
   - Community notification

### Frontend Issues
1. **Rollback Deployment**
   ```bash
   vercel rollback [deployment-url]
   ```

2. **Maintenance Mode**
   - Display maintenance banner
   - Disable critical functions
   - Communicate with users

## 📞 Support

For deployment issues:
- Check [GitHub Issues](https://github.com/0xMgwan/WashikaDAO/issues)
- Join [Discord](https://discord.gg/washikadao)
- Email: support@washikadao.org

## 🔗 Useful Links

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarinet Documentation](https://docs.hiro.so/clarinet)
- [Stacks Explorer](https://explorer.stacks.co/)
- [Testnet Faucet](https://explorer.stacks.co/sandbox/faucet)
