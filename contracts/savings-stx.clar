;; Bulletproof STX Savings Contract
;; Ultra-simple version with maximum safety

;; Constants
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_INSUFFICIENT_SHARES (err u404))

;; Data variables
(define-data-var total-stx uint u0)
(define-data-var total-shares uint u0)

;; Storage maps
(define-map user-shares principal uint)

;; Public functions

;; Deposit STX into the pool (1:1 ratio for simplicity)
(define-public (deposit-stx (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (>= (stx-get-balance tx-sender) amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Transfer STX to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    ;; Update user shares (1:1 ratio)
    (map-set user-shares tx-sender 
      (+ (default-to u0 (map-get? user-shares tx-sender)) amount))
    
    ;; Update pool totals
    (var-set total-stx (+ (var-get total-stx) amount))
    (var-set total-shares (+ (var-get total-shares) amount))
    
    (ok amount)
  )
)

;; Withdraw STX from the pool (1:1 ratio for simplicity)
(define-public (withdraw-stx (amount uint))
  (let ((user-shares-balance (default-to u0 (map-get? user-shares tx-sender))))
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (>= user-shares-balance amount) ERR_INSUFFICIENT_SHARES)
    (asserts! (>= (var-get total-stx) amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Update user shares first
    (map-set user-shares tx-sender (- user-shares-balance amount))
    
    ;; Update pool totals
    (var-set total-stx (- (var-get total-stx) amount))
    (var-set total-shares (- (var-get total-shares) amount))
    
    ;; Transfer STX to user
    (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))
    
    (ok amount)
  )
)

;; Read-only functions
(define-read-only (get-pool-info)
  {
    total-stx: (var-get total-stx),
    total-shares: (var-get total-shares),
    stacking-enabled: false,
    paused: false
  }
)

(define-read-only (get-user-shares (user principal))
  (default-to u0 (map-get? user-shares user))
)

(define-read-only (get-user-stx-balance (user principal))
  ;; In this simple version, shares = STX balance (1:1 ratio)
  (default-to u0 (map-get? user-shares user))
)

(define-read-only (get-user-pending-btc (user principal))
  u0  ;; No BTC rewards in this version
)

(define-read-only (get-exchange-rate)
  u1000000  ;; Always 1:1 ratio with 6 decimals
)
