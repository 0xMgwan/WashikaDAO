;; Community Pool Contract
;; Members contribute STX/sBTC weekly and get redistributed monthly

(impl-trait .dao-governable-trait.dao-governable)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u401))
(define-constant err-insufficient-balance (err u402))
(define-constant err-already-contributed (err u403))
(define-constant err-not-member (err u404))
(define-constant err-distribution-not-ready (err u405))

;; Data Variables
(define-data-var dao-address principal contract-owner)
(define-data-var current-cycle uint u0)
(define-data-var cycle-start-height uint block-height)
(define-data-var total-pool-balance uint u0)
(define-data-var total-members uint u0)

;; Weekly contribution period (approx 1 week = 1008 blocks)
(define-constant blocks-per-week u1008)
;; Monthly distribution period (approx 4 weeks)
(define-constant blocks-per-month u4032)

;; Data Maps
(define-map members principal bool)
(define-map member-contributions 
  { member: principal, cycle: uint }
  { amount: uint, week: uint }
)
(define-map member-total-contributed principal uint)
(define-map cycle-contributions uint uint)
(define-map member-share-percentage 
  { member: principal, cycle: uint }
  uint
)

;; Read-only functions
(define-read-only (is-member (account principal))
  (default-to false (map-get? members account))
)

(define-read-only (get-current-cycle)
  (var-get current-cycle)
)

(define-read-only (get-pool-balance)
  (var-get total-pool-balance)
)

(define-read-only (get-total-members)
  (var-get total-members)
)

(define-read-only (get-member-contribution (member principal) (cycle uint))
  (map-get? member-contributions { member: member, cycle: cycle })
)

(define-read-only (get-member-total (member principal))
  (default-to u0 (map-get? member-total-contributed member))
)

(define-read-only (get-current-week)
  (let ((blocks-since-start (- block-height (var-get cycle-start-height))))
    (/ blocks-since-start blocks-per-week))
)

(define-read-only (can-distribute)
  (let ((blocks-since-start (- block-height (var-get cycle-start-height))))
    (>= blocks-since-start blocks-per-month))
)

(define-read-only (get-member-share (member principal))
  (let (
    (cycle (var-get current-cycle))
    (member-contrib (default-to u0 
      (get amount (map-get? member-contributions { member: member, cycle: cycle }))))
    (total-contrib (default-to u0 (map-get? cycle-contributions cycle)))
  )
    (if (> total-contrib u0)
      (/ (* member-contrib u10000) total-contrib) ;; Percentage in basis points
      u0))
)

;; Public functions

;; Join the community pool
(define-public (join-pool)
  (let ((caller tx-sender))
    (asserts! (not (is-member caller)) err-already-contributed)
    (map-set members caller true)
    (var-set total-members (+ (var-get total-members) u1))
    (ok true))
)

;; Weekly contribution
(define-public (contribute (amount uint))
  (let (
    (caller tx-sender)
    (cycle (var-get current-cycle))
    (week (get-current-week))
    (existing-contrib (map-get? member-contributions { member: caller, cycle: cycle }))
  )
    ;; Must be a member
    (asserts! (is-member caller) err-not-member)
    
    ;; Check if already contributed this week
    (asserts! (is-none existing-contrib) err-already-contributed)
    
    ;; Transfer STX to contract
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    
    ;; Record contribution
    (map-set member-contributions 
      { member: caller, cycle: cycle }
      { amount: amount, week: week }
    )
    
    ;; Update totals
    (map-set member-total-contributed 
      caller 
      (+ (get-member-total caller) amount)
    )
    
    (map-set cycle-contributions 
      cycle 
      (+ (default-to u0 (map-get? cycle-contributions cycle)) amount)
    )
    
    (var-set total-pool-balance (+ (var-get total-pool-balance) amount))
    
    (print {
      event: "contribution",
      member: caller,
      amount: amount,
      cycle: cycle,
      week: week
    })
    
    (ok true))
)

;; Monthly distribution - Equal share to all contributors
(define-public (distribute-monthly)
  (let (
    (cycle (var-get current-cycle))
    (total-balance (var-get total-pool-balance))
    (num-members (var-get total-members))
  )
    ;; Check if distribution period has passed
    (asserts! (can-distribute) err-distribution-not-ready)
    
    ;; Only DAO or contract owner can trigger distribution
    (asserts! (or (is-eq tx-sender contract-owner) 
                  (is-eq tx-sender (var-get dao-address))) 
              err-not-authorized)
    
    ;; Start new cycle
    (var-set current-cycle (+ cycle u1))
    (var-set cycle-start-height block-height)
    (var-set total-pool-balance u0)
    
    (print {
      event: "distribution-started",
      cycle: cycle,
      total-distributed: total-balance,
      members: num-members
    })
    
    (ok { 
      cycle: cycle, 
      amount: total-balance,
      per-member: (if (> num-members u0) (/ total-balance num-members) u0)
    }))
)

;; Claim monthly distribution
(define-public (claim-distribution (cycle uint))
  (let (
    (caller tx-sender)
    (member-contrib (map-get? member-contributions { member: caller, cycle: cycle }))
    (total-cycle-contrib (default-to u0 (map-get? cycle-contributions cycle)))
    (share-percentage (get-member-share caller))
    (distribution-amount (if (> share-percentage u0)
                           (/ (* (var-get total-pool-balance) share-percentage) u10000)
                           u0))
  )
    ;; Must be a member who contributed
    (asserts! (is-some member-contrib) err-not-member)
    
    ;; Transfer distribution
    (try! (as-contract (stx-transfer? distribution-amount tx-sender caller)))
    
    (print {
      event: "distribution-claimed",
      member: caller,
      cycle: cycle,
      amount: distribution-amount
    })
    
    (ok distribution-amount))
)

;; DAO Governable Implementation
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-address)) err-not-authorized)
    (var-set dao-address new-dao)
    (ok true))
)

(define-read-only (get-dao-address)
  (ok (var-get dao-address))
)

;; Emergency withdrawal (DAO only)
(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-address)) err-not-authorized)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (ok true))
)
