# Governance System

WashikaDAO's governance system enables community-driven decision making through token-based voting.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Governance Token│    │   DAO Core      │    │   Timelock      │
│                 │    │                 │    │                 │
│ • WASHA Token   │───▶│ • Proposals     │───▶│ • Delayed Exec  │
│ • Delegation    │    │ • Voting        │    │ • Security      │
│ • Checkpoints   │    │ • Quorum        │    │ • Guardian      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Contracts

### 1. Governance Token (`governance-token.clar`)

**Purpose**: SIP-010 compliant token with delegation and voting checkpoints.

**Key Features**:
- Standard fungible token operations
- Vote delegation system
- Historical voting power queries
- Checkpoint mechanism for governance

**Main Functions**:
```clarity
;; Token operations
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
(define-public (mint (recipient principal) (amount uint))
(define-public (burn (amount uint))

;; Delegation
(define-public (delegate (delegatee principal))
(define-read-only (get-current-votes (account principal))
(define-read-only (get-prior-votes (account principal) (block-height uint))
```

### 2. DAO Core (`washika-dao.clar`)

**Purpose**: Main governance contract managing proposal lifecycle.

**Key Features**:
- Proposal creation with threshold requirements
- Voting mechanism with quorum checks
- State management (Pending → Active → Succeeded/Defeated → Queued → Executed)
- Integration with timelock for execution

**Proposal States**:
- `PENDING`: Waiting for voting delay
- `ACTIVE`: Currently accepting votes
- `CANCELED`: Canceled by proposer or guardian
- `DEFEATED`: Failed to meet quorum or majority
- `SUCCEEDED`: Passed voting requirements
- `QUEUED`: Queued in timelock for execution
- `EXPIRED`: Timelock execution window expired
- `EXECUTED`: Successfully executed

**Main Functions**:
```clarity
;; Proposal management
(define-public (propose (targets (list 10 principal)) (values (list 10 uint)) 
                       (signatures (list 10 (string-ascii 256))) 
                       (calldatas (list 10 (buff 1024))) 
                       (description (string-utf8 1024))))
(define-public (cast-vote (proposal-id uint) (support uint))
(define-public (queue (proposal-id uint))
(define-public (execute (proposal-id uint))
(define-public (cancel (proposal-id uint))

;; State queries
(define-read-only (get-proposal-state (proposal-id uint))
(define-read-only (get-proposal (proposal-id uint))
```

### 3. Timelock (`timelock.clar`)

**Purpose**: Provides time-delayed execution for governance proposals.

**Key Features**:
- Configurable delay period (default: 2 days)
- Grace period for execution (default: 14 days)
- Guardian can cancel malicious proposals
- Admin functions for emergency management

**Main Functions**:
```clarity
;; Transaction management
(define-public (queue-transaction (target principal) (value uint) 
                                 (signature (string-ascii 256)) 
                                 (data (buff 1024)) (eta uint)))
(define-public (execute-transaction (target principal) (value uint) 
                                   (signature (string-ascii 256)) 
                                   (data (buff 1024)) (eta uint)))
(define-public (cancel-transaction (target principal) (value uint) 
                                  (signature (string-ascii 256)) 
                                  (data (buff 1024)) (eta uint)))
```

## Governance Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Voting Delay | 1 block | Time before voting starts |
| Voting Period | 17280 blocks (~3 days) | Duration of voting |
| Proposal Threshold | 100 WASHA | Minimum tokens to create proposal |
| Quorum | 400 WASHA | Minimum votes for proposal validity |
| Timelock Delay | 172800 blocks (~2 weeks) | Execution delay |
| Grace Period | 1209600 blocks (~14 days) | Execution window |

## Governance Process

1. **Proposal Creation**
   - User must hold ≥ 100 WASHA tokens
   - Specify target contracts, values, function signatures, and calldata
   - Provide description of the proposal

2. **Voting Delay**
   - 1 block delay before voting begins
   - Allows time for community to review proposal

3. **Voting Period**
   - 3-day voting window
   - Token holders vote For/Against/Abstain
   - Voting power based on token balance at proposal creation

4. **Quorum Check**
   - Minimum 400 WASHA tokens must participate
   - Simple majority (>50%) required to pass

5. **Timelock Queue**
   - Successful proposals queued in timelock
   - 2-week delay before execution
   - Allows time for community to react

6. **Execution**
   - After timelock delay, proposal can be executed
   - 14-day grace period for execution
   - Anyone can execute a queued proposal

## Security Features

### Access Controls
- Only token holders can vote
- Proposal threshold prevents spam
- Guardian can cancel malicious proposals
- Timelock prevents immediate execution

### Emergency Mechanisms
- Guardian role for emergency actions
- Proposal cancellation by proposer
- Timelock cancellation for security
- Pause functionality for critical issues

## Example Proposals

### 1. Parameter Change
```clarity
;; Change voting period to 5 days
(contract-call? .washika-dao propose
  (list .washika-dao)
  (list u0)
  (list "set-voting-period")
  (list 0x...)  ;; encoded: u28800
  "Increase voting period to 5 days for better participation")
```

### 2. Treasury Allocation
```clarity
;; Allocate 10,000 STX for community grants
(contract-call? .washika-dao propose
  (list .treasury)
  (list u0)
  (list "transfer-stx")
  (list 0x...)  ;; encoded: u10000000000 'SP123...GRANTS
  "Allocate 10,000 STX for Q1 2024 community grants program")
```

### 3. Contract Upgrade
```clarity
;; Upgrade lending contract
(contract-call? .washika-dao propose
  (list .lending-core)
  (list u0)
  (list "set-implementation")
  (list 0x...)  ;; encoded: 'SP123...NEW-LENDING
  "Upgrade lending contract to v2.0 with improved liquidation logic")
```

## Integration Guide

### Frontend Integration
```typescript
// Get proposal state
const proposalState = await callReadOnly('washika-dao', 'get-proposal-state', [uintCV(1)]);

// Cast vote
await makeContractCall('washika-dao', 'cast-vote', [uintCV(1), uintCV(1)]); // Vote "For"

// Check voting power
const votes = await callReadOnly('governance-token', 'get-current-votes', [principalCV(userAddress)]);
```

### Monitoring Events
- Track proposal creation
- Monitor voting activity
- Alert on proposal state changes
- Notify before execution deadlines

## Best Practices

### For Proposers
- Provide detailed descriptions
- Engage community before proposing
- Test proposals on testnet first
- Consider economic impact

### For Voters
- Review proposals thoroughly
- Participate in community discussions
- Vote based on protocol interests
- Delegate if unable to participate actively

### For Developers
- Use read-only functions for queries
- Handle all proposal states in UI
- Implement proper error handling
- Cache frequently accessed data

## Troubleshooting

### Common Issues
- **Proposal creation fails**: Check token balance ≥ threshold
- **Vote not counted**: Ensure tokens held at proposal creation
- **Execution fails**: Verify timelock delay has passed
- **Transaction reverts**: Check proposal state and parameters

### Error Codes
- `401`: Unauthorized (insufficient tokens/permissions)
- `404`: Proposal not found
- `409`: Invalid state transition
- `413`: Below threshold
- `429`: Already voted
