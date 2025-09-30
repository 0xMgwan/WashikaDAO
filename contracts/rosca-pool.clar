;; ROSCA (Rotating Savings and Credit Association) Pool
;; Members contribute weekly, one member receives the full pot each week

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u401))
(define-constant err-not-member (err u404))
(define-constant err-already-contributed-this-round (err u405))
(define-constant err-already-received-payout (err u406))
(define-constant err-round-not-complete (err u407))
(define-constant err-no-members (err u408))

;; Data Variables
(define-data-var dao-address principal contract-owner)
(define-data-var current-round uint u0)
(define-data-var round-start-height uint u0)
(define-data-var total-members uint u0)
(define-data-var contribution-amount uint u10000000) ;; 10 STX default
(define-data-var initialized bool false)

;; Weekly round period (approx 1 week = 1008 blocks)
(define-constant blocks-per-week u1008)

;; Data Maps
(define-map members principal bool)
(define-map member-list uint principal) ;; Index to member address
(define-map member-index principal uint) ;; Member address to index
(define-map round-contributions 
  { member: principal, round: uint }
  bool
)
(define-map received-payout principal bool) ;; Track who has received their payout

;; Read-only functions
(define-read-only (is-member (account principal))
  (default-to false (map-get? members account))
)

(define-read-only (get-current-round)
  (var-get current-round)
)

(define-read-only (get-total-members)
  (var-get total-members)
)

(define-read-only (get-contribution-amount)
  (var-get contribution-amount)
)

(define-read-only (has-contributed-this-round (member principal))
  (default-to false (map-get? round-contributions { member: member, round: (var-get current-round) }))
)

(define-read-only (has-received-payout (member principal))
  (default-to false (map-get? received-payout member))
)

(define-read-only (get-current-recipient)
  (let ((round (var-get current-round))
        (total (var-get total-members)))
    (if (> total u0)
      (map-get? member-list (mod round total))
      none))
)

(define-read-only (get-pool-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (can-distribute)
  (let ((start-height (var-get round-start-height))
        (current-height burn-block-height))
    (if (> start-height u0)
      (>= (- current-height start-height) blocks-per-week)
      false))
)

;; Initialize contract
(define-private (initialize)
  (begin
    (if (not (var-get initialized))
      (begin
        (var-set round-start-height burn-block-height)
        (var-set initialized true)
        true)
      true))
)

;; Join the ROSCA pool
(define-public (join-pool)
  (let ((caller tx-sender)
        (current-index (var-get total-members)))
    (initialize)
    (asserts! (not (is-member caller)) (err u403))
    
    ;; Add member
    (map-set members caller true)
    (map-set member-list current-index caller)
    (map-set member-index caller current-index)
    (var-set total-members (+ current-index u1))
    
    (print {
      event: "member-joined",
      member: caller,
      index: current-index
    })
    
    (ok true))
)

;; Weekly contribution
(define-public (contribute)
  (let (
    (caller tx-sender)
    (round (var-get current-round))
    (amount (var-get contribution-amount))
  )
    (initialize)
    
    ;; Must be a member
    (asserts! (is-member caller) err-not-member)
    
    ;; Check if already contributed this round
    (asserts! (not (has-contributed-this-round caller)) err-already-contributed-this-round)
    
    ;; Transfer STX to contract
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    
    ;; Record contribution
    (map-set round-contributions 
      { member: caller, round: round }
      true
    )
    
    (print {
      event: "contribution",
      member: caller,
      amount: amount,
      round: round
    })
    
    (ok true))
)

;; Distribute pot to this week's recipient
(define-public (distribute-pot)
  (let (
    (round (var-get current-round))
    (total (var-get total-members))
    (recipient-index (mod round total))
    (recipient (unwrap! (map-get? member-list recipient-index) err-no-members))
    (pot-amount (stx-get-balance (as-contract tx-sender)))
  )
    ;; Check if week has passed
    (asserts! (can-distribute) err-round-not-complete)
    
    ;; Only DAO or contract owner can trigger
    (asserts! (or (is-eq tx-sender contract-owner) 
                  (is-eq tx-sender (var-get dao-address))) 
              err-not-authorized)
    
    ;; Check recipient hasn't received payout yet
    (asserts! (not (has-received-payout recipient)) err-already-received-payout)
    
    ;; Transfer pot to recipient
    (try! (as-contract (stx-transfer? pot-amount tx-sender recipient)))
    
    ;; Mark as received
    (map-set received-payout recipient true)
    
    ;; Start new round
    (var-set current-round (+ round u1))
    (var-set round-start-height burn-block-height)
    
    (print {
      event: "pot-distributed",
      round: round,
      recipient: recipient,
      amount: pot-amount
    })
    
    (ok { 
      round: round,
      recipient: recipient,
      amount: pot-amount
    }))
)

;; DAO Management
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-address)) err-not-authorized)
    (var-set dao-address new-dao)
    (ok true))
)

(define-public (set-contribution-amount (new-amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get dao-address)) err-not-authorized)
    (var-set contribution-amount new-amount)
    (ok true))
)

(define-read-only (get-dao-address)
  (ok (var-get dao-address))
)
