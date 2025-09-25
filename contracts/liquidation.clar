;; WashikaDAO Liquidation Contract
;; Handles liquidation of undercollateralized positions

(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)
(use-trait oracle-trait .oracle-price-trait.oracle-price-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_SHORTFALL (err u402))
(define-constant ERR_TOO_MUCH_REPAY (err u403))
(define-constant ERR_LIQUIDATION_FAILED (err u404))
(define-constant ERR_ORACLE_FAILURE (err u405))
(define-constant ERR_INVALID_AMOUNT (err u406))

;; Scaling factors
(define-constant SCALE_FACTOR u1000000000000000000) ;; 18 decimals
(define-constant PRICE_SCALE u100000000) ;; 8 decimals for prices

;; Data variables
(define-data-var dao-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)
(define-data-var lending-core (optional principal) none)
(define-data-var oracle-contract (optional principal) none)

;; Liquidation parameters
(define-data-var close-factor uint u500000000000000000) ;; 50% - max portion of borrow that can be liquidated
(define-data-var liquidation-incentive uint u1080000000000000000) ;; 8% bonus for liquidators

;; Storage maps
(define-map liquidation-history
  {liquidator: principal, borrower: principal, block: uint}
  {
    repay-token: principal,
    seize-token: principal,
    repay-amount: uint,
    seize-amount: uint,
    liquidation-bonus: uint
  }
)

;; Events
(define-private (emit-liquidation (liquidator principal) (borrower principal) (repay-token principal) (seize-token principal) (repay-amount uint) (seize-amount uint))
  (print {
    event: "liquidation",
    liquidator: liquidator,
    borrower: borrower,
    repay-token: repay-token,
    seize-token: seize-token,
    repay-amount: repay-amount,
    seize-amount: seize-amount,
    block-height: block-height
  })
)

;; Authorization helpers
(define-private (is-dao-or-owner)
  (or 
    (is-eq tx-sender CONTRACT_OWNER)
    (match (var-get dao-address)
      dao (is-eq tx-sender dao)
      false
    )
  )
)

(define-private (is-guardian-or-dao)
  (or 
    (is-dao-or-owner)
    (match (var-get guardian)
      guardian-addr (is-eq tx-sender guardian-addr)
      false
    )
  )
)

;; Configuration
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set dao-address (some new-dao))
    (ok true)
  )
)

(define-public (set-guardian (new-guardian principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set guardian (some new-guardian))
    (ok true)
  )
)

(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    (var-set paused pause)
    (ok true)
  )
)

(define-public (set-lending-core (core principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set lending-core (some core))
    (ok true)
  )
)

(define-public (set-oracle-contract (oracle principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set oracle-contract (some oracle))
    (ok true)
  )
)

(define-public (set-close-factor (new-close-factor uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (<= new-close-factor SCALE_FACTOR) ERR_INVALID_AMOUNT)
    (var-set close-factor new-close-factor)
    (ok true)
  )
)

(define-public (set-liquidation-incentive (new-incentive uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (>= new-incentive SCALE_FACTOR) ERR_INVALID_AMOUNT) ;; Must be >= 100%
    (var-set liquidation-incentive new-incentive)
    (ok true)
  )
)

;; Core liquidation function
(define-public (liquidate-borrow (borrower principal) (repay-amount uint) (repay-token principal) (seize-token principal))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> repay-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (is-eq borrower tx-sender)) ERR_UNAUTHORIZED) ;; Can't liquidate yourself
    
    ;; Check if borrower is liquidatable
    (let (
      (core-contract (unwrap! (var-get lending-core) ERR_UNAUTHORIZED))
      (account-liquidity (unwrap! (contract-call? core-contract get-account-liquidity borrower) ERR_LIQUIDATION_FAILED))
    )
      (asserts! (> (get shortfall account-liquidity) u0) ERR_INSUFFICIENT_SHORTFALL)
      
      ;; Get borrower's debt in repay token
      (let (
        (borrow-balance (unwrap! (contract-call? core-contract get-borrow-balance borrower) ERR_LIQUIDATION_FAILED))
        (max-close (/ (* borrow-balance (var-get close-factor)) SCALE_FACTOR))
        (actual-repay-amount (min repay-amount max-close))
      )
        (asserts! (> actual-repay-amount u0) ERR_INVALID_AMOUNT)
        (asserts! (<= actual-repay-amount max-close) ERR_TOO_MUCH_REPAY)
        
        ;; Calculate seize amount
        (let ((seize-amount (try! (calculate-seize-tokens repay-token seize-token actual-repay-amount))))
          ;; Execute liquidation
          (try! (execute-liquidation borrower actual-repay-amount repay-token seize-token seize-amount))
          
          ;; Record liquidation
          (map-set liquidation-history {liquidator: tx-sender, borrower: borrower, block: block-height} {
            repay-token: repay-token,
            seize-token: seize-token,
            repay-amount: actual-repay-amount,
            seize-amount: seize-amount,
            liquidation-bonus: (- (var-get liquidation-incentive) SCALE_FACTOR)
          })
          
          (emit-liquidation tx-sender borrower repay-token seize-token actual-repay-amount seize-amount)
          (ok {repay-amount: actual-repay-amount, seize-amount: seize-amount})
        )
      )
    )
  )
)

;; Calculate seize tokens based on liquidation incentive
(define-private (calculate-seize-tokens (repay-token principal) (seize-token principal) (repay-amount uint))
  (let (
    (oracle (unwrap! (var-get oracle-contract) ERR_ORACLE_FAILURE))
    ;; Get prices from oracle (simplified - using pair names)
    (repay-price (unwrap! (contract-call? oracle get-price "STX-USD") ERR_ORACLE_FAILURE))
    (seize-price (unwrap! (contract-call? oracle get-price "STX-USD") ERR_ORACLE_FAILURE))
  )
    ;; seizeAmount = repayAmount * liquidationIncentive * repayPrice / seizePrice
    (let (
      (repay-value (/ (* repay-amount repay-price) PRICE_SCALE))
      (incentivized-value (/ (* repay-value (var-get liquidation-incentive)) SCALE_FACTOR))
      (seize-amount (/ (* incentivized-value PRICE_SCALE) seize-price))
    )
      (ok seize-amount)
    )
  )
)

;; Execute the actual liquidation
(define-private (execute-liquidation (borrower principal) (repay-amount uint) (repay-token principal) (seize-token principal) (seize-amount uint))
  (let ((core-contract (unwrap! (var-get lending-core) ERR_UNAUTHORIZED)))
    ;; For STX liquidation (simplified)
    (if (is-eq repay-token (as-contract tx-sender)) ;; STX repayment
      (begin
        ;; Repay borrower's debt
        (try! (as-contract (stx-transfer? repay-amount tx-sender core-contract)))
        ;; Seize collateral for liquidator
        (try! (contract-call? core-contract withdraw-stx seize-amount))
        (ok true)
      )
      ;; Token liquidation would go here
      (ok true)
    )
  )
)

;; Batch liquidation for multiple positions
(define-public (batch-liquidate (liquidations (list 10 {borrower: principal, repay-amount: uint, repay-token: principal, seize-token: principal})))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (fold execute-batch-liquidation liquidations (ok u0))
  )
)

(define-private (execute-batch-liquidation 
  (liquidation-data {borrower: principal, repay-amount: uint, repay-token: principal, seize-token: principal})
  (previous-result (response uint uint))
)
  (match previous-result
    success (liquidate-borrow 
              (get borrower liquidation-data)
              (get repay-amount liquidation-data)
              (get repay-token liquidation-data)
              (get seize-token liquidation-data))
    error (err error)
  )
)

;; Liquidation bot functions
(define-public (get-liquidatable-accounts (accounts (list 50 principal)))
  (ok (filter is-account-liquidatable accounts))
)

(define-private (is-account-liquidatable (account principal))
  (match (var-get lending-core)
    core-contract (match (contract-call? core-contract get-account-liquidity account)
      account-liquidity (> (get shortfall account-liquidity) u0)
      false
    )
    false
  )
)

;; Health factor calculation (for monitoring)
(define-read-only (get-health-factor (account principal))
  (match (var-get lending-core)
    core-contract (match (contract-call? core-contract get-account-liquidity account)
      account-liquidity (let (
        (liquidity (get liquidity account-liquidity))
        (shortfall (get shortfall account-liquidity))
      )
        (if (> shortfall u0)
          u0 ;; Liquidatable
          (if (is-eq (+ liquidity shortfall) u0)
            SCALE_FACTOR ;; Exactly at limit
            (/ (* liquidity SCALE_FACTOR) (+ liquidity shortfall)) ;; Health factor
          )
        )
      )
      u0
    )
    u0
  )
)

;; Emergency liquidation (guardian only)
(define-public (emergency-liquidate (borrower principal) (repay-token principal) (seize-token principal))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    
    ;; Force liquidate without normal checks
    (let (
      (core-contract (unwrap! (var-get lending-core) ERR_UNAUTHORIZED))
      (borrow-balance (unwrap! (contract-call? core-contract get-borrow-balance borrower) ERR_LIQUIDATION_FAILED))
      (seize-amount (try! (calculate-seize-tokens repay-token seize-token borrow-balance)))
    )
      (try! (execute-liquidation borrower borrow-balance repay-token seize-token seize-amount))
      
      (print {
        event: "emergency-liquidation",
        borrower: borrower,
        repay-amount: borrow-balance,
        seize-amount: seize-amount,
        block-height: block-height
      })
      
      (ok {repay-amount: borrow-balance, seize-amount: seize-amount})
    )
  )
)

;; Read-only functions
(define-read-only (get-liquidation-parameters)
  {
    close-factor: (var-get close-factor),
    liquidation-incentive: (var-get liquidation-incentive),
    lending-core: (var-get lending-core),
    oracle-contract: (var-get oracle-contract)
  }
)

(define-read-only (get-liquidation-history (liquidator principal) (borrower principal) (block uint))
  (map-get? liquidation-history {liquidator: liquidator, borrower: borrower, block: block})
)

(define-read-only (calculate-max-liquidation (borrower principal) (repay-token principal))
  (match (var-get lending-core)
    core-contract (match (contract-call? core-contract get-borrow-balance borrower)
      borrow-balance (ok (/ (* borrow-balance (var-get close-factor)) SCALE_FACTOR))
      (err ERR_LIQUIDATION_FAILED)
    )
    (err ERR_UNAUTHORIZED)
  )
)
