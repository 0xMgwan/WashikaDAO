;; WashikaDAO sBTC Savings Contract
;; Handles sBTC deposits, withdrawals, and yield distribution

(impl-trait .dao-governable-trait.dao-governable-trait)
(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_INSUFFICIENT_SHARES (err u404))
(define-constant ERR_TRANSFER_FAILED (err u405))

;; Scaling factor for share calculations (8 decimals to match sBTC)
(define-constant SCALE_FACTOR u100000000)

;; Data variables
(define-data-var dao-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)
(define-data-var sbtc-token (optional principal) none)

;; Pool state
(define-data-var total-sbtc uint u0)
(define-data-var total-shares uint u0)

;; Reward tracking for multiple reward tokens
(define-data-var reward-index-washa uint u0)
(define-data-var last-reward-block uint u0)

;; Storage maps
(define-map user-shares principal uint)
(define-map user-reward-index-washa principal uint)
(define-map user-accrued-washa principal uint)

;; Reward token tracking
(define-map reward-tokens principal bool)

;; Events
(define-private (emit-deposit (user principal) (sbtc-amount uint) (shares-minted uint))
  (print {
    event: "sbtc-deposit",
    user: user,
    sbtc-amount: sbtc-amount,
    shares-minted: shares-minted,
    total-sbtc: (var-get total-sbtc),
    total-shares: (var-get total-shares),
    burn-block-height: burn-block-height
  })
)

(define-private (emit-withdrawal (user principal) (shares-burned uint) (sbtc-amount uint))
  (print {
    event: "sbtc-withdrawal",
    user: user,
    shares-burned: shares-burned,
    sbtc-amount: sbtc-amount,
    total-sbtc: (var-get total-sbtc),
    total-shares: (var-get total-shares),
    burn-block-height: burn-block-height
  })
)

(define-private (emit-rewards-distributed (token principal) (amount uint))
  (print {
    event: "rewards-distributed",
    token: token,
    amount: amount,
    reward-index: (var-get reward-index-washa),
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

;; sBTC token management
(define-public (set-sbtc-token (token principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set sbtc-token (some token))
    (ok true)
  )
)

(define-read-only (get-sbtc-token)
  (var-get sbtc-token)
)

;; Share calculation helpers
(define-private (calculate-shares-to-mint (sbtc-amount uint))
  (let (
    (current-total-sbtc (var-get total-sbtc))
    (current-total-shares (var-get total-shares))
  )
    (if (is-eq current-total-shares u0)
      ;; First deposit: 1:1 ratio
      sbtc-amount
      ;; Subsequent deposits: maintain ratio
      (/ (* sbtc-amount current-total-shares) current-total-sbtc)
    )
  )
)

(define-private (calculate-sbtc-to-withdraw (shares uint))
  (let (
    (current-total-sbtc (var-get total-sbtc))
    (current-total-shares (var-get total-shares))
  )
    (if (is-eq current-total-shares u0)
      u0
      (/ (* shares current-total-sbtc) current-total-shares)
    )
  )
)

;; Reward calculation helpers
(define-private (update-user-rewards (user principal))
  (let (
    (user-shares-amount (get-user-shares user))
    (current-reward-index (var-get reward-index-washa))
    (user-reward-index (default-to u0 (map-get? user-reward-index-washa user)))
    (pending-rewards (if (> current-reward-index user-reward-index)
                       (/ (* user-shares-amount (- current-reward-index user-reward-index)) SCALE_FACTOR)
                       u0))
  )
    (if (> pending-rewards u0)
      (begin
        (map-set user-accrued-washa user (+ (get-user-accrued-washa user) pending-rewards))
        (map-set user-reward-index-washa user current-reward-index)
      )
      true
    )
  )
)

;; Core deposit/withdrawal functions
(define-public (deposit-sbtc (token <ft-trait>) (amount uint))
  (let (
    (shares-to-mint (calculate-shares-to-mint amount))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (is-eq (some (contract-of token)) (var-get sbtc-token)) ERR_UNAUTHORIZED)
    
    ;; Update user rewards before changing shares
    (update-user-rewards tx-sender)
    
    ;; Transfer sBTC to contract
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    
    ;; Update state
    (var-set total-sbtc (+ (var-get total-sbtc) amount))
    (var-set total-shares (+ (var-get total-shares) shares-to-mint))
    (map-set user-shares tx-sender (+ (get-user-shares tx-sender) shares-to-mint))
    (map-set user-reward-index-washa tx-sender (var-get reward-index-washa))
    
    (emit-deposit tx-sender amount shares-to-mint)
    (ok shares-to-mint)
  )
)

(define-public (withdraw-sbtc (token <ft-trait>) (shares uint))
  (let (
    (user-shares-balance (get-user-shares tx-sender))
    (sbtc-to-withdraw (calculate-sbtc-to-withdraw shares))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (> shares u0) ERR_INVALID_AMOUNT)
    (asserts! (>= user-shares-balance shares) ERR_INSUFFICIENT_SHARES)
    (asserts! (is-eq (some (contract-of token)) (var-get sbtc-token)) ERR_UNAUTHORIZED)
    
    ;; Update user rewards before changing shares
    (update-user-rewards tx-sender)
    
    ;; Update state
    (var-set total-sbtc (- (var-get total-sbtc) sbtc-to-withdraw))
    (var-set total-shares (- (var-get total-shares) shares))
    (map-set user-shares tx-sender (- user-shares-balance shares))
    
    ;; Transfer sBTC back to user
    (try! (as-contract (contract-call? token transfer sbtc-to-withdraw tx-sender tx-sender none)))
    
    (emit-withdrawal tx-sender shares sbtc-to-withdraw)
    (ok sbtc-to-withdraw)
  )
)

;; Reward distribution
(define-public (distribute-rewards (reward-token <ft-trait>) (amount uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Transfer reward tokens to contract
    (try! (contract-call? reward-token transfer amount tx-sender (as-contract tx-sender) none))
    
    ;; Update reward index (assuming WASHA rewards for now)
    (let (
      (current-total-shares (var-get total-shares))
      (reward-per-share (if (> current-total-shares u0)
                         (/ (* amount SCALE_FACTOR) current-total-shares)
                         u0))
    )
      (var-set reward-index-washa (+ (var-get reward-index-washa) reward-per-share))
      (var-set last-reward-block burn-block-height)
      
      ;; Mark token as reward token
      (map-set reward-tokens (contract-of reward-token) true)
      
      (emit-rewards-distributed (contract-of reward-token) amount)
      (ok true)
    )
  )
)

(define-public (claim-rewards (reward-token <ft-trait>))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (default-to false (map-get? reward-tokens (contract-of reward-token))) ERR_UNAUTHORIZED)
    
    ;; Update user rewards
    (update-user-rewards tx-sender)
    
    (let ((accrued-rewards (get-user-accrued-washa tx-sender)))
      (asserts! (> accrued-rewards u0) ERR_INSUFFICIENT_BALANCE)
      
      ;; Reset user accrued rewards
      (map-set user-accrued-washa tx-sender u0)
      
      ;; Transfer rewards to user
      (try! (as-contract (contract-call? reward-token transfer accrued-rewards tx-sender tx-sender none)))
      
      (print {
        event: "rewards-claimed",
        user: tx-sender,
        token: (contract-of reward-token),
        amount: accrued-rewards,
        burn-block-height: burn-block-height
      })
      
      (ok accrued-rewards)
    )
  )
)

;; Emergency functions
(define-public (emergency-withdraw (token <ft-trait>) (recipient principal))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    (let ((balance (unwrap! (contract-call? token get-balance (as-contract tx-sender)) ERR_TRANSFER_FAILED)))
      (try! (as-contract (contract-call? token transfer balance tx-sender recipient none)))
      (print {
        event: "emergency-withdrawal",
        token: (contract-of token),
        recipient: recipient,
        amount: balance,
        burn-block-height: burn-block-height
      })
      (ok balance)
    )
  )
)

;; Read-only functions
(define-read-only (get-user-shares (user principal))
  (default-to u0 (map-get? user-shares user))
)

(define-read-only (get-user-sbtc-balance (user principal))
  (calculate-sbtc-to-withdraw (get-user-shares user))
)

(define-read-only (get-user-accrued-washa (user principal))
  (default-to u0 (map-get? user-accrued-washa user))
)

(define-read-only (get-user-pending-rewards (user principal))
  (let (
    (user-shares-amount (get-user-shares user))
    (current-reward-index (var-get reward-index-washa))
    (user-reward-index (default-to u0 (map-get? user-reward-index-washa user)))
  )
    (if (> current-reward-index user-reward-index)
      (/ (* user-shares-amount (- current-reward-index user-reward-index)) SCALE_FACTOR)
      u0
    )
  )
)

(define-read-only (get-pool-info)
  {
    total-sbtc: (var-get total-sbtc),
    total-shares: (var-get total-shares),
    sbtc-token: (var-get sbtc-token),
    reward-index-washa: (var-get reward-index-washa),
    last-reward-block: (var-get last-reward-block)
  }
)

(define-read-only (get-exchange-rate)
  (let (
    (current-total-sbtc (var-get total-sbtc))
    (current-total-shares (var-get total-shares))
  )
    (if (is-eq current-total-shares u0)
      SCALE_FACTOR
      (/ (* current-total-sbtc SCALE_FACTOR) current-total-shares)
    )
  )
)

(define-read-only (is-reward-token (token principal))
  (default-to false (map-get? reward-tokens token))
)
