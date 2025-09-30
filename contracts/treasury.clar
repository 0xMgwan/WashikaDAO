;; WashikaDAO Treasury Contract
;; Manages DAO funds including STX and fungible tokens

(impl-trait .dao-governable-trait.dao-governable-trait)
(use-trait ft-trait .sip010-ft-trait.sip010-ft-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_INVALID_RECIPIENT (err u404))
(define-constant ERR_TRANSFER_FAILED (err u405))

;; Data variables
(define-data-var dao-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)

;; Authorized spenders for specific operations
(define-map authorized-spenders principal bool)

;; Events
(define-private (emit-stx-transfer (recipient principal) (amount uint))
  (print {
    event: "stx-transfer",
    recipient: recipient,
    amount: amount,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-token-transfer (token principal) (recipient principal) (amount uint))
  (print {
    event: "token-transfer",
    token: token,
    recipient: recipient,
    amount: amount,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-spender-authorized (spender principal) (authorized bool))
  (print {
    event: "spender-authorized",
    spender: spender,
    authorized: authorized,
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

(define-private (is-authorized-spender)
  (or 
    (is-dao-or-owner)
    (default-to false (map-get? authorized-spenders tx-sender))
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

;; Spender management
(define-public (authorize-spender (spender principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (map-set authorized-spenders spender true)
    (emit-spender-authorized spender true)
    (ok true)
  )
)

(define-public (revoke-spender (spender principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (map-delete authorized-spenders spender)
    (emit-spender-authorized spender false)
    (ok true)
  )
)

(define-read-only (is-spender-authorized (spender principal))
  (default-to false (map-get? authorized-spenders spender))
)

;; STX management
(define-public (transfer-stx (recipient principal) (amount uint))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-authorized-spender) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR_INVALID_RECIPIENT)
    
    (let ((treasury-balance (stx-get-balance (as-contract tx-sender))))
      (asserts! (>= treasury-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      (try! (as-contract (stx-transfer? amount tx-sender recipient)))
      (emit-stx-transfer recipient amount)
      (ok true)
    )
  )
)

;; Fungible token management
(define-public (transfer-token (token <ft-trait>) (recipient principal) (amount uint))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-authorized-spender) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR_INVALID_RECIPIENT)
    
    (let ((treasury-balance (unwrap! (contract-call? token get-balance (as-contract tx-sender)) ERR_TRANSFER_FAILED)))
      (asserts! (>= treasury-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      (try! (as-contract (contract-call? token transfer amount tx-sender recipient none)))
      (emit-token-transfer (contract-of token) recipient amount)
      (ok true)
    )
  )
)

;; Batch transfers
(define-public (batch-transfer-stx (recipients (list 50 {recipient: principal, amount: uint})))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-authorized-spender) ERR_UNAUTHORIZED)
    
    (fold batch-stx-transfer-fold recipients (ok u0))
  )
)

(define-private (batch-stx-transfer-fold (transfer-data {recipient: principal, amount: uint}) (previous-result (response uint uint)))
  (match previous-result
    success (transfer-stx (get recipient transfer-data) (get amount transfer-data))
    error (err error)
  )
)

(define-public (batch-transfer-token (token <ft-trait>) (recipients (list 50 {recipient: principal, amount: uint})))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-authorized-spender) ERR_UNAUTHORIZED)
    
    (fold (batch-token-transfer-fold token) recipients (ok u0))
  )
)

(define-private (batch-token-transfer-fold (token <ft-trait>) (transfer-data {recipient: principal, amount: uint}) (previous-result (response uint uint)))
  (match previous-result
    success (transfer-token token (get recipient transfer-data) (get amount transfer-data))
    error (err error)
  )
)

;; Emergency functions
(define-public (emergency-withdraw-stx (recipient principal))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    (let ((balance (stx-get-balance (as-contract tx-sender))))
      (try! (as-contract (stx-transfer? balance tx-sender recipient)))
      (emit-stx-transfer recipient balance)
      (ok balance)
    )
  )
)

(define-public (emergency-withdraw-token (token <ft-trait>) (recipient principal))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    (let ((balance (unwrap! (contract-call? token get-balance (as-contract tx-sender)) ERR_TRANSFER_FAILED)))
      (try! (as-contract (contract-call? token transfer balance tx-sender recipient none)))
      (emit-token-transfer (contract-of token) recipient balance)
      (ok balance)
    )
  )
)

;; Read-only functions
(define-read-only (get-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-token-balance (token <ft-trait>))
  (contract-call? token get-balance (as-contract tx-sender))
)

;; Receive STX (payable function)
(define-public (deposit-stx)
  (begin
    (asserts! (> stx-transfer-amount u0) ERR_INVALID_AMOUNT)
    (print {
      event: "stx-deposit",
      depositor: tx-sender,
      amount: stx-transfer-amount,
      burn-block-height: burn-block-height
    })
    (ok stx-transfer-amount)
  )
)

;; Receive tokens
(define-public (deposit-token (token <ft-trait>) (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    (print {
      event: "token-deposit",
      depositor: tx-sender,
      token: (contract-of token),
      amount: amount,
      burn-block-height: burn-block-height
    })
    (ok amount)
  )
)
