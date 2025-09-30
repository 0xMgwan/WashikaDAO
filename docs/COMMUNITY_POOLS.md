# 🏘️ Community Pools Architecture

## Overview

WashikaDAO's Community Pool system enables groups to save together and support each other through weekly contributions and monthly distributions.

## Current Implementation: Single Global Pool

### How It Works

1. **Join Pool** - Anyone can become a member (one-time action)
2. **Weekly Contributions** - Members contribute STX each week
3. **Monthly Distribution** - At the end of each month (cycle), funds are distributed
4. **Claim Rewards** - Members claim their proportional share

### Distribution Formula

```
Your Share = (Your Total Contributions / Total Pool Contributions) × Pool Balance
```

### Example Scenario

**Month 1:**
- Alice contributes: 100 STX (Week 1) + 100 STX (Week 2) + 100 STX (Week 3) + 100 STX (Week 4) = 400 STX
- Bob contributes: 75 STX × 4 weeks = 300 STX
- Carol contributes: 75 STX × 4 weeks = 300 STX

**Total Pool: 1,000 STX**

**Distribution:**
- Alice: 400 STX (40% of pool)
- Bob: 300 STX (30% of pool)
- Carol: 300 STX (30% of pool)

**Plus PoX Rewards:**
- Pool earns ~7% APY in BTC through stacking
- Monthly BTC rewards: ~5.83 STX equivalent
- Distributed proportionally to contributions

## Future: Multiple Community Pools

### Vision

Each community (village, neighborhood, group) has their own pool:

```
WashikaDAO
├── Pool Factory Contract
├── Community Pool #1 (Kenya Village A)
│   ├── 50 members
│   ├── 5,000 STX balance
│   └── Cycle #3
├── Community Pool #2 (Nigeria Group B)
│   ├── 30 members
│   ├── 3,000 STX balance
│   └── Cycle #2
└── Community Pool #3 (Tanzania Cooperative)
    ├── 100 members
    ├── 10,000 STX balance
    └── Cycle #5
```

### Benefits

1. **Local Autonomy** - Each community manages their own pool
2. **Cultural Fit** - Rules can be customized per community
3. **Trust** - Members know each other
4. **Accountability** - Local governance and oversight
5. **Scalability** - Unlimited pools can be created

### Implementation Plan

#### Phase 1: Pool Factory Contract
```clarity
(define-public (create-community-pool (name (string-utf8 50)))
  ;; Deploy new pool instance
  ;; Register in global registry
  ;; Set creator as admin
)
```

#### Phase 2: Pool Registry
- Track all community pools
- Enable discovery
- Show statistics

#### Phase 3: Pool Management
- Community admins can:
  - Set contribution schedules
  - Trigger distributions
  - Add/remove members
  - Set rules

## Key Metrics

### Pool Level
- **Total Members** - Number of people in the pool
- **Current Cycle** - Which month/period we're in
- **Pool Balance** - Total STX in the pool
- **Cycle Start** - When current cycle began
- **Can Distribute** - If enough time has passed (4 weeks)

### Member Level
- **Is Member** - Whether user has joined
- **Total Contributions** - Lifetime contributions
- **Current Cycle Contribution** - This month's contributions
- **Share Percentage** - % of pool they'll receive
- **Claimable Amount** - STX they can claim

## User Flows

### New Member Journey

1. **Discover** → Find WashikaDAO through referral
2. **Connect Wallet** → Use Xverse/Leather
3. **Join Pool** → One-click membership
4. **Contribute** → Weekly STX contributions
5. **Track** → See pool grow in real-time
6. **Claim** → Monthly distribution
7. **Refer** → Invite others to join

### Weekly Contribution

```
User → Contribute 10 STX
     → Transaction confirmed
     → Pool balance increases
     → User's total updated
     → Dashboard reflects change
```

### Monthly Distribution

```
DAO/Admin → Trigger distribution
          → New cycle starts
          → Members notified
          → Claim window opens
          
Member → Claim distribution
       → Receive proportional share
       → Funds to wallet
       → Ready for next cycle
```

## Referral System

### How It Works

1. **Generate Referral Link**
   ```
   https://washikadao.com/join?ref=ST1ABC...XYZ
   ```

2. **Share Link** - Via WhatsApp, SMS, social media

3. **Track Referrals** - See who joined through your link

4. **Earn Rewards** (Future)
   - 1% bonus on referee's contributions
   - WASHA governance tokens
   - Community recognition

### Implementation

```clarity
(define-map referrals
  { referee: principal }
  { referrer: principal, timestamp: uint }
)

(define-public (join-pool-with-referral (referrer principal))
  ;; Join pool
  ;; Record referral
  ;; Award bonus to referrer
)
```

## Security & Governance

### Access Control

- **Pool Members** - Can contribute and claim
- **DAO** - Can trigger distributions
- **Contract Owner** - Emergency functions only

### Safety Features

1. **Time Locks** - Can't distribute before 4 weeks
2. **Member Checks** - Must join before contributing
3. **Balance Tracking** - Accurate accounting
4. **Proportional Distribution** - Fair allocation

### Emergency Procedures

```clarity
(define-public (emergency-withdraw (amount uint) (recipient principal))
  ;; Only DAO can call
  ;; For critical situations
  ;; Fully transparent on-chain
)
```

## Technical Details

### Contract Functions

**Read-Only:**
- `get-total-members` - Count of pool members
- `get-current-cycle` - Current cycle number
- `get-pool-balance` - Total STX in pool
- `is-member` - Check membership status
- `get-member-total` - User's lifetime contributions
- `can-distribute` - Check if distribution is ready

**Public:**
- `join-pool` - Become a member
- `contribute` - Add STX to pool
- `distribute-monthly` - Start new cycle
- `claim-distribution` - Get your share

### Data Structures

```clarity
;; Members
(define-map members principal bool)

;; Contributions per cycle
(define-map member-contributions 
  { member: principal, cycle: uint }
  { amount: uint, week: uint }
)

;; Lifetime totals
(define-map member-total-contributed principal uint)

;; Cycle totals
(define-map cycle-contributions uint uint)
```

## Roadmap

### ✅ Phase 1: MVP (Current)
- Single global pool
- Join, contribute, distribute
- Basic metrics
- Frontend integration

### 🔄 Phase 2: Enhanced Features (In Progress)
- Real-time metrics
- Claim distribution UI
- Referral system
- Dashboard integration

### 📋 Phase 3: Multiple Pools (Planned)
- Pool factory contract
- Community creation
- Pool discovery
- Inter-pool features

### 🚀 Phase 4: Advanced Features (Future)
- Automated distributions
- Flexible schedules
- Loan integration
- Cross-pool lending
- Mobile app

## FAQ

**Q: What happens if I miss a week?**
A: No problem! Contribute when you can. No penalties.

**Q: Can I withdraw my contributions?**
A: Not during the cycle. Wait for monthly distribution.

**Q: What if someone doesn't claim?**
A: Unclaimed funds roll over to next cycle.

**Q: How are PoX rewards distributed?**
A: Proportionally based on your contribution percentage.

**Q: Can I be in multiple pools?**
A: Yes! Once we implement multiple pools.

**Q: Who triggers the distribution?**
A: Currently the DAO. Future: Automated or community vote.

## Resources

- **Contract**: `STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28.community-pool`
- **Explorer**: https://explorer.stacks.co/?chain=testnet
- **Frontend**: https://washikadao.com
- **Docs**: https://docs.washikadao.com

## Support

For questions or issues:
- GitHub Issues
- Discord Community
- Email: support@washikadao.com
