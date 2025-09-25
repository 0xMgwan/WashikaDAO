;; WashikaDAO Timelock Contract
;; Provides time-delayed execution of governance proposals

(impl-trait .dao-governable-trait.dao-governable-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_TRANSACTION_NOT_FOUND (err u404))
(define-constant ERR_TRANSACTION_NOT_READY (err u405))
(define-constant ERR_TRANSACTION_STALE (err u406))
(define-constant ERR_TRANSACTION_ALREADY_EXECUTED (err u407))
(define-constant ERR_EXECUTION_FAILED (err u408))
(define-constant ERR_INVALID_DELAY (err u409))

;; Data variables
(define-data-var admin principal CONTRACT_OWNER)
(define-data-var pending-admin (optional principal) none)
(define-data-var delay uint u144) ;; ~24 hours in blocks (assuming 10min blocks)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)

;; Storage maps
(define-map queued-transactions
  (buff 32) ;; transaction hash
  {
    target: principal,
    value: uint,
    signature: (string-ascii 256),
    data: (buff 2048),
    eta: uint,
    executed: bool,
    canceled: bool
  }
)

;; Events
(define-private (emit-transaction-queued (tx-hash (buff 32)) (target principal) (value uint) (signature (string-ascii 256)) (data (buff 2048)) (eta uint))
  (print {
    event: "transaction-queued",
    tx-hash: tx-hash,
    target: target,
    value: value,
    signature: signature,
    data: data,
    eta: eta,
    block-height: block-height
  })
)

(define-private (emit-transaction-executed (tx-hash (buff 32)) (target principal) (value uint) (signature (string-ascii 256)) (data (buff 2048)))
  (print {
    event: "transaction-executed",
    tx-hash: tx-hash,
    target: target,
    value: value,
    signature: signature,
    data: data,
    block-height: block-height
  })
)

(define-private (emit-transaction-canceled (tx-hash (buff 32)))
  (print {
    event: "transaction-canceled",
    tx-hash: tx-hash,
    block-height: block-height
  })
)

;; Authorization helpers
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (is-guardian-or-admin)
  (or 
    (is-admin)
    (match (var-get guardian)
      guardian-addr (is-eq tx-sender guardian-addr)
      false
    )
  )
)

;; DAO Governable Trait Implementation
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (var-set admin new-dao)
    (ok true)
  )
)

(define-read-only (get-dao-address)
  (ok (var-get admin))
)

(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-guardian-or-admin) ERR_UNAUTHORIZED)
    (var-set paused pause)
    (ok true)
  )
)

(define-read-only (is-paused)
  (ok (var-get paused))
)

(define-public (set-guardian (new-guardian principal))
  (begin
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (var-set guardian (some new-guardian))
    (ok true)
  )
)

(define-read-only (get-guardian)
  (ok (var-get guardian))
)

;; Admin management
(define-public (set-pending-admin (new-admin principal))
  (begin
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (var-set pending-admin (some new-admin))
    (ok true)
  )
)

(define-public (accept-admin)
  (begin
    (asserts! (is-eq (some tx-sender) (var-get pending-admin)) ERR_UNAUTHORIZED)
    (var-set admin tx-sender)
    (var-set pending-admin none)
    (ok true)
  )
)

;; Delay management
(define-public (set-delay (new-delay uint))
  (begin
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (asserts! (and (>= new-delay u144) (<= new-delay u2880)) ERR_INVALID_DELAY) ;; 1-20 days
    (var-set delay new-delay)
    (ok true)
  )
)

(define-read-only (get-delay)
  (var-get delay)
)

;; Transaction hash generation
(define-private (get-tx-hash (target principal) (value uint) (signature (string-ascii 256)) (data (buff 2048)) (eta uint))
  (keccak256 (concat
    (concat (unwrap-panic (to-consensus-buff? target)) (unwrap-panic (to-consensus-buff? value)))
    (concat (unwrap-panic (to-consensus-buff? signature)) (concat (unwrap-panic (to-consensus-buff? data)) (unwrap-panic (to-consensus-buff? eta))))
  ))
)

;; Queue transaction
(define-public (queue-transaction (target principal) (value uint) (signature (string-ascii 256)) (data (buff 2048)) (eta uint))
  (let (
    (tx-hash (get-tx-hash target value signature data eta))
    (current-block block-height)
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (asserts! (>= eta (+ current-block (var-get delay))) ERR_INVALID_DELAY)
    
    ;; Store transaction
    (map-set queued-transactions tx-hash {
      target: target,
      value: value,
      signature: signature,
      data: data,
      eta: eta,
      executed: false,
      canceled: false
    })
    
    (emit-transaction-queued tx-hash target value signature data eta)
    (ok tx-hash)
  )
)

;; Execute transaction
(define-public (execute-transaction (target principal) (value uint) (signature (string-ascii 256)) (data (buff 2048)) (eta uint))
  (let (
    (tx-hash (get-tx-hash target value signature data eta))
    (transaction (unwrap! (map-get? queued-transactions tx-hash) ERR_TRANSACTION_NOT_FOUND))
    (current-block block-height)
    (grace-period u2880) ;; ~20 days
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (asserts! (not (get executed transaction)) ERR_TRANSACTION_ALREADY_EXECUTED)
    (asserts! (not (get canceled transaction)) ERR_TRANSACTION_NOT_FOUND)
    (asserts! (>= current-block eta) ERR_TRANSACTION_NOT_READY)
    (asserts! (<= current-block (+ eta grace-period)) ERR_TRANSACTION_STALE)
    
    ;; Mark as executed
    (map-set queued-transactions tx-hash (merge transaction {executed: true}))
    
    ;; Execute the transaction (simplified - in practice would make the actual call)
    ;; This would involve contract-call? to the target with the specified function and data
    
    (emit-transaction-executed tx-hash target value signature data)
    (ok true)
  )
)

;; Cancel transaction
(define-public (cancel-transaction (target principal) (value uint) (signature (string-ascii 256)) (data (buff 2048)) (eta uint))
  (let (
    (tx-hash (get-tx-hash target value signature data eta))
    (transaction (unwrap! (map-get? queued-transactions tx-hash) ERR_TRANSACTION_NOT_FOUND))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-guardian-or-admin) ERR_UNAUTHORIZED)
    (asserts! (not (get executed transaction)) ERR_TRANSACTION_ALREADY_EXECUTED)
    
    ;; Mark as canceled
    (map-set queued-transactions tx-hash (merge transaction {canceled: true}))
    
    (emit-transaction-canceled tx-hash)
    (ok true)
  )
)

;; Getters
(define-read-only (get-transaction (tx-hash (buff 32)))
  (map-get? queued-transactions tx-hash)
)

(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (get-pending-admin)
  (var-get pending-admin)
)
