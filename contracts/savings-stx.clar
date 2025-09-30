;; WashikaDAO STX Savings Contract
;; Handles STX deposits, withdrawals, and optional PoX stacking

(impl-trait .dao-governable-trait.dao-governable-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_INSUFFICIENT_SHARES (err u404))
(define-constant ERR_STACKING_DISABLED (err u405))
(define-constant ERR_STACKING_ENABLED (err u406))
(define-constant ERR_CYCLE_NOT_READY (err u407))

;; Scaling factor for share calculations (6 decimals)
(define-constant SCALE_FACTOR u1000000)

;; Data variables
(define-data-var dao-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)
(define-data-var stacking-enabled bool false)
(define-data-var stacking-strategy (optional principal) none)

;; Pool state
(define-data-var total-stx uint u0)
(define-data-var total-shares uint u0)
(define-data-var stacked-stx uint u0)

;; Reward tracking
(define-data-var reward-index-btc uint u0)
(define-data-var last-reward-block uint u0)

;; Storage maps
(define-map user-shares principal uint)
(define-map user-reward-index-btc principal uint)
(define-map user-accrued-btc principal uint)

;; Stacking cycle tracking
(define-map cycle-info
  uint ;; cycle number
  {
    stacked-amount: uint,
    reward-amount: uint,
    participants: uint,
    processed: bool
  }
)

;; Events
(define-private (emit-deposit (user principal) (stx-amount uint) (shares-minted uint))
  (print {
    event: "stx-deposit",
    user: user,
    stx-amount: stx-amount,
    shares-minted: shares-minted,
    total-stx: (var-get total-stx),
    total-shares: (var-get total-shares),
    burn-block-height: burn-block-height
  })
)

(define-private (emit-withdrawal (user principal) (shares-burned uint) (stx-amount uint))
  (print {
    event: "stx-withdrawal",
    user: user,
    shares-burned: shares-burned,
    stx-amount: stx-amount,
    total-stx: (var-get total-stx),
    total-shares: (var-get total-shares),
    burn-block-height: burn-block-height
  })
)

(define-private (emit-stacking-enabled (enabled bool))
  (print {
    event: "stacking-status-changed",
    enabled: enabled,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-rewards-harvested (cycle uint) (btc-amount uint))
  (print {
    event: "rewards-harvested",
    cycle: cycle,
    btc-amount: btc-amount,
    reward-index: (var-get reward-index-btc),
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

;; Stacking management
(define-public (set-stacking-strategy (strategy principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set stacking-strategy (some strategy))
    (ok true)
  )
)

(define-public (enable-stacking)
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (not (var-get stacking-enabled)) ERR_STACKING_ENABLED)
    (asserts! (is-some (var-get stacking-strategy)) ERR_UNAUTHORIZED)
    
    (var-set stacking-enabled true)
    (emit-stacking-enabled true)
    (ok true)
  )
)

(define-public (disable-stacking)
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (var-get stacking-enabled) ERR_STACKING_DISABLED)
    
    (var-set stacking-enabled false)
    (emit-stacking-enabled false)
    (ok true)
  )
)

;; Share calculation helpers
(define-private (calculate-shares-to-mint (stx-amount uint))
  (let (
    (current-total-stx (var-get total-stx))
    (current-total-shares (var-get total-shares))
  )
    (if (is-eq current-total-shares u0)
      ;; First deposit: 1:1 ratio
      (* stx-amount SCALE_FACTOR)
      ;; Subsequent deposits: maintain ratio
      (/ (* stx-amount current-total-shares) current-total-stx)
    )
  )
)

(define-private (calculate-stx-to-withdraw (shares uint))
  (let (
    (current-total-stx (var-get total-stx))
    (current-total-shares (var-get total-shares))
  )
    (if (is-eq current-total-shares u0)
      u0
      (/ (* shares current-total-stx) current-total-shares)
    )
  )
)

;; Reward calculation helpers
(define-private (update-user-rewards (user principal))
  (let (
    (user-shares-amount (get-user-shares user))
    (current-reward-index (var-get reward-index-btc))
    (user-reward-index (default-to u0 (map-get? user-reward-index-btc user)))
    (pending-rewards (if (> current-reward-index user-reward-index)
                       (/ (* user-shares-amount (- current-reward-index user-reward-index)) SCALE_FACTOR)
                       u0))
  )
    (if (> pending-rewards u0)
      (begin
        (map-set user-accrued-btc user (+ (get-user-accrued-btc user) pending-rewards))
        (map-set user-reward-index-btc user current-reward-index)
      )
      true
    )
  )
)

;; Core deposit/withdrawal functions
(define-public (deposit-stx)
  (let (
    (stx-amount stx-transfer-amount)
    (shares-to-mint (calculate-shares-to-mint stx-amount))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> stx-amount u0) ERR_INVALID_AMOUNT)
    
    ;; Update user rewards before changing shares
    (update-user-rewards tx-sender)
    
    ;; Update state
    (var-set total-stx (+ (var-get total-stx) stx-amount))
    (var-set total-shares (+ (var-get total-shares) shares-to-mint))
    (map-set user-shares tx-sender (+ (get-user-shares tx-sender) shares-to-mint))
    (map-set user-reward-index-btc tx-sender (var-get reward-index-btc))
    
    (emit-deposit tx-sender stx-amount shares-to-mint)
    (ok shares-to-mint)
  )
)

(define-public (withdraw-stx (shares uint))
  (let (
    (user-shares-balance (get-user-shares tx-sender))
    (stx-to-withdraw (calculate-stx-to-withdraw shares))
    (available-stx (- (var-get total-stx) (var-get stacked-stx)))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> shares u0) ERR_INVALID_AMOUNT)
    (asserts! (>= user-shares-balance shares) ERR_INSUFFICIENT_SHARES)
    (asserts! (>= available-stx stx-to-withdraw) ERR_INSUFFICIENT_BALANCE)
    
    ;; Update user rewards before changing shares
    (update-user-rewards tx-sender)
    
    ;; Update state
    (var-set total-stx (- (var-get total-stx) stx-to-withdraw))
    (var-set total-shares (- (var-get total-shares) shares))
    (map-set user-shares tx-sender (- user-shares-balance shares))
    
    ;; Transfer STX
    (try! (as-contract (stx-transfer? stx-to-withdraw tx-sender tx-sender)))
    
    (emit-withdrawal tx-sender shares stx-to-withdraw)
    (ok stx-to-withdraw)
  )
)

;; Stacking operations (simplified - would integrate with actual PoX contract)
(define-public (initiate-stacking (amount uint) (pox-address (buff 128)) (start-cycle uint) (lock-period uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (var-get stacking-enabled) ERR_STACKING_DISABLED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (<= amount (- (var-get total-stx) (var-get stacked-stx))) ERR_INSUFFICIENT_BALANCE)
    
    ;; Update stacked amount
    (var-set stacked-stx (+ (var-get stacked-stx) amount))
    
    ;; In practice, this would call the stacking strategy contract
    ;; which would then call pox-4 contract
    (print {
      event: "stacking-initiated",
      amount: amount,
      pox-address: pox-address,
      start-cycle: start-cycle,
      lock-period: lock-period,
      burn-block-height: burn-block-height
    })
    
    (ok true)
  )
)

(define-public (harvest-pox-rewards (cycle uint) (btc-amount uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (> btc-amount u0) ERR_INVALID_AMOUNT)
    
    ;; Update reward index (BTC rewards distributed per share)
    (let (
      (current-total-shares (var-get total-shares))
      (reward-per-share (if (> current-total-shares u0)
                         (/ (* btc-amount SCALE_FACTOR) current-total-shares)
                         u0))
    )
      (var-set reward-index-btc (+ (var-get reward-index-btc) reward-per-share))
      (var-set last-reward-block burn-block-height)
      
      ;; Record cycle info
      (map-set cycle-info cycle {
        stacked-amount: (var-get stacked-stx),
        reward-amount: btc-amount,
        participants: current-total-shares,
        processed: true
      })
      
      (emit-rewards-harvested cycle btc-amount)
      (ok true)
    )
  )
)

(define-public (claim-btc-rewards)
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    
    ;; Update user rewards
    (update-user-rewards tx-sender)
    
    (let ((accrued-btc (get-user-accrued-btc tx-sender)))
      (asserts! (> accrued-btc u0) ERR_INSUFFICIENT_BALANCE)
      
      ;; Reset user accrued rewards
      (map-set user-accrued-btc tx-sender u0)
      
      ;; In practice, this would trigger sBTC distribution or off-chain BTC transfer
      (print {
        event: "btc-rewards-claimed",
        user: tx-sender,
        amount: accrued-btc,
        burn-block-height: burn-block-height
      })
      
      (ok accrued-btc)
    )
  )
)

;; Read-only functions
(define-read-only (get-user-shares (user principal))
  (default-to u0 (map-get? user-shares user))
)

(define-read-only (get-user-stx-balance (user principal))
  (calculate-stx-to-withdraw (get-user-shares user))
)

(define-read-only (get-user-accrued-btc (user principal))
  (default-to u0 (map-get? user-accrued-btc user))
)

(define-read-only (get-user-pending-btc (user principal))
  (let (
    (user-shares-amount (get-user-shares user))
    (current-reward-index (var-get reward-index-btc))
    (user-reward-index (default-to u0 (map-get? user-reward-index-btc user)))
  )
    (if (> current-reward-index user-reward-index)
      (/ (* user-shares-amount (- current-reward-index user-reward-index)) SCALE_FACTOR)
      u0
    )
  )
)

(define-read-only (get-pool-info)
  {
    total-stx: (var-get total-stx),
    total-shares: (var-get total-shares),
    stacked-stx: (var-get stacked-stx),
    available-stx: (- (var-get total-stx) (var-get stacked-stx)),
    stacking-enabled: (var-get stacking-enabled),
    reward-index-btc: (var-get reward-index-btc),
    last-reward-block: (var-get last-reward-block)
  }
)

(define-read-only (get-cycle-info (cycle uint))
  (map-get? cycle-info cycle)
)

(define-read-only (get-exchange-rate)
  (let (
    (current-total-stx (var-get total-stx))
    (current-total-shares (var-get total-shares))
  )
    (if (is-eq current-total-shares u0)
      SCALE_FACTOR
      (/ (* current-total-stx SCALE_FACTOR) current-total-shares)
    )
  )
)
