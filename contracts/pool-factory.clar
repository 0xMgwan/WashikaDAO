;; Pool Factory Contract
;; Creates and manages multiple ROSCA pools

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u401))
(define-constant err-pool-exists (err u402))
(define-constant err-invalid-params (err u403))

;; Data Variables
(define-data-var pool-count uint u0)

;; Data Maps
(define-map pools
  uint
  {
    name: (string-utf8 100),
    creator: principal,
    contribution-amount: uint,
    cycle-blocks: uint,
    max-members: uint,
    created-at: uint,
    contract-id: (string-ascii 100)
  }
)

(define-map pool-by-creator
  principal
  (list 10 uint)
)

(define-map pool-members
  { pool-id: uint, member: principal }
  bool
)

(define-map pool-contributions
  { pool-id: uint, member: principal, round: uint }
  uint
)

(define-map pool-balances uint uint)

;; Read-only functions
(define-read-only (get-pool-count)
  (var-get pool-count)
)

(define-read-only (get-pool (pool-id uint))
  (map-get? pools pool-id)
)

(define-read-only (get-pools-by-creator (creator principal))
  (default-to (list) (map-get? pool-by-creator creator))
)

(define-read-only (is-pool-member (pool-id uint) (member principal))
  (default-to false (map-get? pool-members { pool-id: pool-id, member: member }))
)

(define-read-only (get-pool-balance (pool-id uint))
  (default-to u0 (map-get? pool-balances pool-id))
)

;; Public functions

;; Register a new pool
(define-public (register-pool 
  (name (string-utf8 100))
  (contribution-amount uint)
  (cycle-blocks uint)
  (max-members uint)
  (contract-id (string-ascii 100))
)
  (let (
    (pool-id (var-get pool-count))
    (creator tx-sender)
  )
    ;; Validate parameters
    (asserts! (> contribution-amount u0) err-invalid-params)
    (asserts! (> cycle-blocks u0) err-invalid-params)
    (asserts! (> max-members u1) err-invalid-params)
    
    ;; Register pool
    (map-set pools pool-id {
      name: name,
      creator: creator,
      contribution-amount: contribution-amount,
      cycle-blocks: cycle-blocks,
      max-members: max-members,
      created-at: burn-block-height,
      contract-id: contract-id
    })
    
    ;; Add to creator's list
    (let ((creator-pools (default-to (list) (map-get? pool-by-creator creator))))
      (map-set pool-by-creator creator (unwrap-panic (as-max-len? (append creator-pools pool-id) u10)))
    )
    
    ;; Increment counter
    (var-set pool-count (+ pool-id u1))
    
    (print {
      event: "pool-registered",
      pool-id: pool-id,
      name: name,
      creator: creator
    })
    
    (ok pool-id))
)

;; Join a pool
(define-public (join-pool (pool-id uint))
  (let (
    (member tx-sender)
    (pool-data (unwrap! (map-get? pools pool-id) (err u404)))
  )
    ;; Check if already a member
    (asserts! (not (is-pool-member pool-id member)) (err u405))
    
    ;; Add member
    (map-set pool-members { pool-id: pool-id, member: member } true)
    
    (print {
      event: "member-joined",
      pool-id: pool-id,
      member: member
    })
    
    (ok true))
)

;; Contribute to a specific pool
(define-public (contribute-to-pool (pool-id uint))
  (let (
    (member tx-sender)
    (pool-data (unwrap! (map-get? pools pool-id) (err u404)))
    (contribution-amt (get contribution-amount pool-data))
    (current-round u0)
  )
    ;; Must be a member
    (asserts! (is-pool-member pool-id member) (err u405))
    
    ;; Transfer STX to contract
    (try! (stx-transfer? contribution-amt member (as-contract tx-sender)))
    
    ;; Record contribution
    (map-set pool-contributions 
      { pool-id: pool-id, member: member, round: current-round }
      contribution-amt
    )
    
    ;; Update pool balance
    (map-set pool-balances 
      pool-id 
      (+ (default-to u0 (map-get? pool-balances pool-id)) contribution-amt)
    )
    
    (print {
      event: "contribution",
      pool-id: pool-id,
      member: member,
      amount: contribution-amt
    })
    
    (ok true))
)

;; Get all pools (paginated)
(define-read-only (get-pools (offset uint) (limit uint))
  (let ((total (var-get pool-count)))
    (ok {
      total: total,
      pools: (get-pools-range offset (min (+ offset limit) total))
    }))
)

(define-private (get-pools-range (start uint) (end uint))
  (map get-pool-safe (list-range start end))
)

(define-private (get-pool-safe (pool-id uint))
  (map-get? pools pool-id)
)

(define-private (list-range (start uint) (end uint))
  ;; Helper to create range - simplified for now
  (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9)
)

(define-private (min (a uint) (b uint))
  (if (< a b) a b)
)
