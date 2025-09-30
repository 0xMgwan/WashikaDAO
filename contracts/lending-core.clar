;; WashikaDAO Lending Core Contract
;; Handles collateralized lending with STX and sBTC

(impl-trait .dao-governable-trait.dao-governable-trait)
(impl-trait .market-trait.market-trait)
(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)
(use-trait oracle-trait .oracle-price-trait.oracle-price-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_INSUFFICIENT_COLLATERAL (err u404))
(define-constant ERR_MARKET_NOT_FOUND (err u405))
(define-constant ERR_LIQUIDATION_THRESHOLD (err u406))
(define-constant ERR_ORACLE_FAILURE (err u407))
(define-constant ERR_INTEREST_ACCRUAL (err u408))

;; Scaling factors
(define-constant SCALE_FACTOR u1000000000000000000) ;; 18 decimals
(define-constant PRICE_SCALE u100000000) ;; 8 decimals for prices
(define-constant BLOCKS_PER_YEAR u52560) ;; ~10 min blocks

;; Data variables
(define-data-var dao-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)
(define-data-var oracle-contract (optional principal) none)
(define-data-var interest-model (optional principal) none)
(define-data-var liquidation-contract (optional principal) none)

;; Market configuration
(define-map markets
  principal ;; asset contract
  {
    is-listed: bool,
    collateral-factor: uint, ;; 18 decimals (e.g., 0.75 = 750000000000000000)
    liquidation-threshold: uint, ;; 18 decimals
    liquidation-penalty: uint, ;; 18 decimals
    reserve-factor: uint, ;; 18 decimals
    supply-cap: uint,
    borrow-cap: uint,
    is-collateral: bool
  }
)

;; Market state
(define-map market-state
  principal ;; asset contract
  {
    total-supply: uint,
    total-borrows: uint,
    total-reserves: uint,
    supply-index: uint, ;; 18 decimals
    borrow-index: uint, ;; 18 decimals
    accrual-block: uint,
    supply-rate: uint, ;; per block
    borrow-rate: uint ;; per block
  }
)

;; User positions
(define-map supply-balances
  {user: principal, asset: principal}
  {
    principal: uint,
    interest-index: uint
  }
)

(define-map borrow-balances
  {user: principal, asset: principal}
  {
    principal: uint,
    interest-index: uint
  }
)

;; User collateral assets
(define-map user-collateral-assets
  principal ;; user
  (list 10 principal) ;; list of asset contracts used as collateral
)

;; Events
(define-private (emit-supply (user principal) (asset principal) (amount uint))
  (print {
    event: "supply",
    user: user,
    asset: asset,
    amount: amount,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-withdraw (user principal) (asset principal) (amount uint))
  (print {
    event: "withdraw",
    user: user,
    asset: asset,
    amount: amount,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-borrow (user principal) (asset principal) (amount uint))
  (print {
    event: "borrow",
    user: user,
    asset: asset,
    amount: amount,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-repay (user principal) (asset principal) (amount uint))
  (print {
    event: "repay",
    user: user,
    asset: asset,
    amount: amount,
    burn-block-height: burn-block-height
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

;; DAO Governable Trait Implementation
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set dao-address (some new-dao))
    (ok true)
  )
)

(define-read-only (get-dao-address)
  (ok (var-get dao-address))
)

(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    (var-set paused pause)
    (ok true)
  )
)

(define-read-only (is-paused)
  (ok (var-get paused))
)

(define-public (set-guardian (new-guardian principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set guardian (some new-guardian))
    (ok true)
  )
)

(define-read-only (get-guardian)
  (ok (var-get guardian))
)

;; Configuration
(define-public (set-oracle-contract (oracle principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set oracle-contract (some oracle))
    (ok true)
  )
)

(define-public (set-interest-model (model principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set interest-model (some model))
    (ok true)
  )
)

(define-public (set-liquidation-contract (liquidator principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set liquidation-contract (some liquidator))
    (ok true)
  )
)

;; Market management
(define-public (list-market (asset principal) (collateral-factor uint) (liquidation-threshold uint) (liquidation-penalty uint) (reserve-factor uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (<= collateral-factor SCALE_FACTOR) ERR_INVALID_AMOUNT)
    (asserts! (<= liquidation-threshold SCALE_FACTOR) ERR_INVALID_AMOUNT)
    (asserts! (<= liquidation-penalty SCALE_FACTOR) ERR_INVALID_AMOUNT)
    (asserts! (<= reserve-factor SCALE_FACTOR) ERR_INVALID_AMOUNT)
    
    ;; Create market
    (map-set markets asset {
      is-listed: true,
      collateral-factor: collateral-factor,
      liquidation-threshold: liquidation-threshold,
      liquidation-penalty: liquidation-penalty,
      reserve-factor: reserve-factor,
      supply-cap: u0, ;; No cap initially
      borrow-cap: u0, ;; No cap initially
      is-collateral: true
    })
    
    ;; Initialize market state
    (map-set market-state asset {
      total-supply: u0,
      total-borrows: u0,
      total-reserves: u0,
      supply-index: SCALE_FACTOR,
      borrow-index: SCALE_FACTOR,
      accrual-block: burn-block-height,
      supply-rate: u0,
      borrow-rate: u0
    })
    
    (ok true)
  )
)

;; Interest accrual
(define-public (accrue-interest (asset principal))
  (let (
    (market (unwrap! (map-get? markets asset) ERR_MARKET_NOT_FOUND))
    (state (unwrap! (map-get? market-state asset) ERR_MARKET_NOT_FOUND))
    (blocks-elapsed (- burn-block-height (get accrual-block state)))
  )
    (if (is-eq blocks-elapsed u0)
      (ok true)
      (let (
        (borrow-rate (get borrow-rate state))
        (supply-rate (get supply-rate state))
        (total-borrows (get total-borrows state))
        (total-reserves (get total-reserves state))
        (reserve-factor (get reserve-factor market))
        
        ;; Calculate new indexes
        (borrow-rate-per-block (* borrow-rate blocks-elapsed))
        (supply-rate-per-block (* supply-rate blocks-elapsed))
        (new-borrow-index (+ (get borrow-index state) (/ (* (get borrow-index state) borrow-rate-per-block) SCALE_FACTOR)))
        (new-supply-index (+ (get supply-index state) (/ (* (get supply-index state) supply-rate-per-block) SCALE_FACTOR)))
        
        ;; Calculate interest and reserves
        (interest-accumulated (/ (* total-borrows borrow-rate-per-block) SCALE_FACTOR))
        (reserves-added (/ (* interest-accumulated reserve-factor) SCALE_FACTOR))
        (new-total-borrows (+ total-borrows interest-accumulated))
        (new-total-reserves (+ total-reserves reserves-added))
      )
        ;; Update rates based on new utilization
        (let ((new-rates (try! (update-interest-rates asset (get total-supply state) new-total-borrows new-total-reserves))))
          ;; Update market state
          (map-set market-state asset {
            total-supply: (get total-supply state),
            total-borrows: new-total-borrows,
            total-reserves: new-total-reserves,
            supply-index: new-supply-index,
            borrow-index: new-borrow-index,
            accrual-block: burn-block-height,
            supply-rate: (get supply-rate new-rates),
            borrow-rate: (get borrow-rate new-rates)
          })
          (ok true)
        )
      )
    )
  )
)

;; Interest rate calculation
(define-private (update-interest-rates (asset principal) (total-supply uint) (total-borrows uint) (total-reserves uint))
  (match (var-get interest-model)
    model (let (
      (cash (- total-supply total-borrows))
      (utilization (if (is-eq total-supply u0) 
                     u0 
                     (/ (* total-borrows SCALE_FACTOR) total-supply)))
    )
      ;; In practice, this would call the interest model contract
      ;; For now, we'll use a simple linear model
      (let (
        (base-rate u20000000000000000) ;; 2% base rate
        (multiplier u100000000000000000) ;; 10% multiplier
        (borrow-rate (+ base-rate (/ (* utilization multiplier) SCALE_FACTOR)))
        (supply-rate (/ (* borrow-rate utilization) SCALE_FACTOR))
      )
        (ok {supply-rate: supply-rate, borrow-rate: borrow-rate})
      )
    )
    (err ERR_INTEREST_ACCRUAL)
  )
)

;; Market Trait Implementation
(define-public (deposit (amount uint))
  ;; This is a simplified version - in practice, you'd specify the asset
  (err ERR_UNAUTHORIZED) ;; Use supply-stx or supply-token instead
)

(define-public (withdraw (amount uint))
  ;; This is a simplified version - in practice, you'd specify the asset
  (err ERR_UNAUTHORIZED) ;; Use withdraw-stx or withdraw-token instead
)

(define-public (borrow (amount uint))
  ;; This is a simplified version - in practice, you'd specify the asset
  (err ERR_UNAUTHORIZED) ;; Use borrow-stx or borrow-token instead
)

(define-public (repay (amount uint))
  ;; This is a simplified version - in practice, you'd specify the asset
  (err ERR_UNAUTHORIZED) ;; Use repay-stx or repay-token instead
)

;; STX market functions
(define-public (supply-stx)
  (let (
    (amount stx-transfer-amount)
    (asset-key 'STX) ;; Using symbol for STX
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Accrue interest first
    (try! (accrue-interest (as-contract tx-sender))) ;; Use contract as STX identifier
    
    ;; Update user supply balance
    (let (
      (current-balance (get-supply-balance-internal tx-sender (as-contract tx-sender)))
      (state (unwrap! (map-get? market-state (as-contract tx-sender)) ERR_MARKET_NOT_FOUND))
      (new-balance (+ current-balance (/ (* amount (get supply-index state)) SCALE_FACTOR)))
    )
      (map-set supply-balances {user: tx-sender, asset: (as-contract tx-sender)} {
        principal: new-balance,
        interest-index: (get supply-index state)
      })
      
      ;; Update market state
      (map-set market-state (as-contract tx-sender) 
        (merge state {total-supply: (+ (get total-supply state) amount)}))
      
      (emit-supply tx-sender (as-contract tx-sender) amount)
      (ok amount)
    )
  )
)

(define-public (withdraw-stx (amount uint))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Accrue interest first
    (try! (accrue-interest (as-contract tx-sender)))
    
    ;; Check user balance and liquidity
    (let (
      (user-balance (get-supply-balance tx-sender))
      (liquidity-check (try! (get-account-liquidity tx-sender)))
    )
      (asserts! (>= (unwrap-panic user-balance) amount) ERR_INSUFFICIENT_BALANCE)
      (asserts! (>= (get liquidity liquidity-check) amount) ERR_INSUFFICIENT_COLLATERAL)
      
      ;; Update user balance
      (let (
        (state (unwrap! (map-get? market-state (as-contract tx-sender)) ERR_MARKET_NOT_FOUND))
        (current-balance (get-supply-balance-internal tx-sender (as-contract tx-sender)))
        (new-balance (- current-balance (/ (* amount (get supply-index state)) SCALE_FACTOR)))
      )
        (map-set supply-balances {user: tx-sender, asset: (as-contract tx-sender)} {
          principal: new-balance,
          interest-index: (get supply-index state)
        })
        
        ;; Update market state
        (map-set market-state (as-contract tx-sender) 
          (merge state {total-supply: (- (get total-supply state) amount)}))
        
        ;; Transfer STX
        (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))
        
        (emit-withdraw tx-sender (as-contract tx-sender) amount)
        (ok amount)
      )
    )
  )
)

(define-public (borrow-stx (amount uint))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Accrue interest first
    (try! (accrue-interest (as-contract tx-sender)))
    
    ;; Check liquidity
    (let ((liquidity-check (try! (get-account-liquidity tx-sender))))
      (asserts! (>= (get liquidity liquidity-check) amount) ERR_INSUFFICIENT_COLLATERAL)
      
      ;; Update user borrow balance
      (let (
        (state (unwrap! (map-get? market-state (as-contract tx-sender)) ERR_MARKET_NOT_FOUND))
        (current-balance (get-borrow-balance-internal tx-sender (as-contract tx-sender)))
        (new-balance (+ current-balance (/ (* amount (get borrow-index state)) SCALE_FACTOR)))
      )
        (map-set borrow-balances {user: tx-sender, asset: (as-contract tx-sender)} {
          principal: new-balance,
          interest-index: (get borrow-index state)
        })
        
        ;; Update market state
        (map-set market-state (as-contract tx-sender) 
          (merge state {total-borrows: (+ (get total-borrows state) amount)}))
        
        ;; Transfer STX
        (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))
        
        (emit-borrow tx-sender (as-contract tx-sender) amount)
        (ok amount)
      )
    )
  )
)

(define-public (repay-stx)
  (let ((amount stx-transfer-amount))
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Accrue interest first
    (try! (accrue-interest (as-contract tx-sender)))
    
    ;; Update user borrow balance
    (let (
      (current-balance (get-borrow-balance-internal tx-sender (as-contract tx-sender)))
      (repay-amount (min amount current-balance))
      (state (unwrap! (map-get? market-state (as-contract tx-sender)) ERR_MARKET_NOT_FOUND))
      (new-balance (- current-balance repay-amount))
    )
      (map-set borrow-balances {user: tx-sender, asset: (as-contract tx-sender)} {
        principal: new-balance,
        interest-index: (get borrow-index state)
      })
      
      ;; Update market state
      (map-set market-state (as-contract tx-sender) 
        (merge state {total-borrows: (- (get total-borrows state) repay-amount)}))
      
      (emit-repay tx-sender (as-contract tx-sender) repay-amount)
      (ok repay-amount)
    )
  )
)

;; Account liquidity calculation
(define-public (get-account-liquidity (user principal))
  (let (
    (collateral-assets (default-to (list) (map-get? user-collateral-assets user)))
    (liquidity-data (fold calculate-user-liquidity collateral-assets {liquidity: u0, shortfall: u0, user: user}))
  )
    (ok {
      liquidity: (get liquidity liquidity-data),
      shortfall: (get shortfall liquidity-data)
    })
  )
)

(define-private (calculate-user-liquidity (asset principal) (acc {liquidity: uint, shortfall: uint, user: principal}))
  (let (
    (user (get user acc))
    (market (default-to {is-listed: false, collateral-factor: u0, liquidation-threshold: u0, liquidation-penalty: u0, reserve-factor: u0, supply-cap: u0, borrow-cap: u0, is-collateral: false} (map-get? markets asset)))
    (supply-balance (get-supply-balance-internal user asset))
    (borrow-balance (get-borrow-balance-internal user asset))
  )
    (if (get is-listed market)
      (let (
        ;; Get asset price (simplified - would use oracle)
        (asset-price PRICE_SCALE) ;; $1 for now
        (collateral-value (/ (* supply-balance asset-price (get collateral-factor market)) (* SCALE_FACTOR PRICE_SCALE)))
        (borrow-value (/ (* borrow-balance asset-price) PRICE_SCALE))
      )
        {
          liquidity: (+ (get liquidity acc) collateral-value),
          shortfall: (+ (get shortfall acc) borrow-value),
          user: user
        }
      )
      acc
    )
  )
)

;; Helper functions
(define-private (get-supply-balance-internal (user principal) (asset principal))
  (let ((balance-data (map-get? supply-balances {user: user, asset: asset})))
    (match balance-data
      data (get principal data)
      u0
    )
  )
)

(define-private (get-borrow-balance-internal (user principal) (asset principal))
  (let ((balance-data (map-get? borrow-balances {user: user, asset: asset})))
    (match balance-data
      data (get principal data)
      u0
    )
  )
)

;; Market Trait read-only implementations
(define-read-only (get-supply-balance (user principal))
  (ok (get-supply-balance-internal user (as-contract tx-sender)))
)

(define-read-only (get-borrow-balance (user principal))
  (ok (get-borrow-balance-internal user (as-contract tx-sender)))
)

(define-read-only (get-supply-rate)
  (let ((state (map-get? market-state (as-contract tx-sender))))
    (match state
      data (ok (get supply-rate data))
      (ok u0)
    )
  )
)

(define-read-only (get-borrow-rate)
  (let ((state (map-get? market-state (as-contract tx-sender))))
    (match state
      data (ok (get borrow-rate data))
      (ok u0)
    )
  )
)

(define-read-only (get-utilization-rate)
  (let ((state (map-get? market-state (as-contract tx-sender))))
    (match state
      data (if (is-eq (get total-supply data) u0)
             (ok u0)
             (ok (/ (* (get total-borrows data) SCALE_FACTOR) (get total-supply data))))
      (ok u0)
    )
  )
)

(define-read-only (get-total-supply)
  (let ((state (map-get? market-state (as-contract tx-sender))))
    (match state
      data (ok (get total-supply data))
      (ok u0)
    )
  )
)

(define-read-only (get-total-borrows)
  (let ((state (map-get? market-state (as-contract tx-sender))))
    (match state
      data (ok (get total-borrows data))
      (ok u0)
    )
  )
)

;; Additional read-only functions
(define-read-only (get-market-info (asset principal))
  (map-get? markets asset)
)

(define-read-only (get-market-state-info (asset principal))
  (map-get? market-state asset)
)
