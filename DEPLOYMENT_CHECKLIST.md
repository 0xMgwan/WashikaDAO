# ✅ Deployment Checklist for WashikaDAO

## Before You Start

- [ ] **Install Leather Wallet**
  - Go to: https://leather.io/
  - Install browser extension
  - Create new wallet or import existing
  
- [ ] **Switch to Testnet**
  - Open Leather wallet
  - Click settings (gear icon)
  - Select "Testnet" network
  
- [ ] **Get Testnet STX**
  - Go to: https://explorer.stacks.co/sandbox/faucet?chain=testnet
  - Copy your testnet address from Leather
  - Paste and request STX
  - Wait ~30 seconds for confirmation
  - You should receive 500 STX

## Deployment Order

### Phase 1: Traits (Deploy First)
- [ ] 1. sip010-ft-trait
- [ ] 2. oracle-price-trait
- [ ] 3. dao-governable-trait
- [ ] 4. market-trait

### Phase 2: Core Contracts
- [ ] 5. governance-token
- [ ] 6. washika-dao
- [ ] 7. timelock
- [ ] 8. treasury

### Phase 3: Community Pool ⭐ (Your Main Feature)
- [ ] 9. **community-pool** (Weekly contributions, monthly distributions)

### Phase 4: Savings
- [ ] 10. savings-stx
- [ ] 11. savings-sbtc
- [ ] 12. stacking-strategy

### Phase 5: Lending (Optional for MVP)
- [ ] 13. interest-model-kink
- [ ] 14. lending-core
- [ ] 15. liquidation
- [ ] 16. oracle-aggregator

## After Each Deployment

1. ✅ Copy the contract address
2. ✅ Save it in a text file
3. ✅ Wait for confirmation (~30 seconds)
4. ✅ Verify on explorer

## Contract Addresses (Fill as you deploy)

```
sip010-ft-trait: 
oracle-price-trait: 
dao-governable-trait: 
market-trait: 
governance-token: 
washika-dao: 
timelock: 
treasury: 
community-pool: ⭐
savings-stx: 
savings-sbtc: 
stacking-strategy: 
```

## Estimated Costs

- Each contract: ~0.05-0.1 STX
- Total for all contracts: ~1-2 STX
- You have 500 STX, so plenty! ✅

## If Something Goes Wrong

- **Transaction fails**: Check you have enough STX
- **Contract error**: Verify dependencies are deployed first
- **Wallet not connecting**: Refresh page and reconnect
- **Need help**: Check transaction in explorer for error details
