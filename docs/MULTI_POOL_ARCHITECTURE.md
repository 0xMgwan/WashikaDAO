# Multi-Pool Architecture

## Current Status

### What Works ✅
- Users can create pools with custom parameters (name, contribution, cycle, members)
- Pools are registered in the `pool-factory` contract on-chain
- Users can join specific pools via factory
- Pool metadata is displayed correctly
- Each pool shows its own parameters (5 STX vs 10 STX, etc.)

### Current Limitation ⚠️
**All pools currently share the same `rosca-pool` contract for contributions.**

This means:
- If you contribute to Pool A, it goes to the main ROSCA contract
- If you then try to contribute to Pool B, it will fail (already contributed this round)
- Contributions are not isolated per pool

## Architecture Options

### Option 1: Shared Contract (Current - Simple but Limited)
```
Pool Factory (Metadata Only)
├── Pool 1: "Wana" (5 STX, 7 days)
├── Pool 2: "wanang" (5 STX, 7 days)
└── Pool 3: "Village" (10 STX, 14 days)
         ↓
    All use same
    rosca-pool contract
```

**Pros:**
- Simple to implement
- Works immediately
- Low gas costs

**Cons:**
- Can only contribute to one pool per round
- Not truly independent pools
- Confusing UX

### Option 2: Separate Contracts (Proper - Complex but Correct)
```
Pool Factory (Registry)
├── Pool 1 → rosca-wana-123.clar
├── Pool 2 → rosca-wanang-456.clar
└── Pool 3 → rosca-village-789.clar
```

**Pros:**
- True pool independence
- Can join/contribute to multiple pools
- Clean architecture
- Scalable

**Cons:**
- Requires deploying a contract for each pool
- Higher gas costs
- More complex UX

## Implementation Plan for Option 2

### Step 1: Contract Deployment Flow
When user creates a pool:
1. User fills form (name, contribution, cycle, members)
2. Frontend generates unique contract name
3. Frontend creates contract code with embedded parameters
4. User signs contract deployment transaction
5. Wait for confirmation
6. Register deployed contract in factory
7. Pool is now active!

### Step 2: Update Factory
Add function to store deployed contract addresses:
```clarity
(define-map pool-contracts uint principal)

(define-public (set-pool-contract (pool-id uint) (contract principal))
  ;; Only pool creator can set
  (ok true))
```

### Step 3: Update Frontend
- Detect if pool has deployed contract
- If yes: use that contract for join/contribute
- If no: show "Deploy Contract" button

## Quick Fix for Testing

For immediate testing, we can:
1. Manually deploy a ROSCA contract for one pool
2. Update the factory with that contract address
3. Update frontend to use it

**Command:**
```bash
STACKS_PRIVATE_KEY=xxx node deploy-pool.js "Test Pool" 5 7 10
```

## Recommended Next Steps

1. **Short term:** Document current limitations clearly in UI
2. **Medium term:** Implement automated contract deployment
3. **Long term:** Consider using a proxy pattern or pool templates

## User Communication

**Current Message:**
"This pool is registered but contributions require a dedicated contract. Join to reserve your spot!"

**Better Message:**
"Pool created! To enable contributions, we need to deploy a dedicated contract. This is a one-time setup that takes ~30 seconds."

## Technical Notes

- Clarity contracts cannot deploy other contracts
- Each deployment costs ~0.5 STX in fees
- Contract names must be unique per address
- Max contract name length: 40 characters
- Contract code is immutable once deployed

## Future Enhancements

1. **Pool Templates:** Pre-deploy common configurations
2. **Lazy Deployment:** Deploy contract on first join
3. **Batch Deployment:** Deploy multiple pools at once
4. **Contract Upgrades:** Use proxy pattern for upgradability
