;; ROSCA Pool Template
;; This contract can be deployed with custom parameters for each pool

;; Constants - These would be set during deployment
(define-constant contract-owner tx-sender)
(define-constant err-not-authorized (err u401))
(define-constant err-not-member (err u404))
(define-constant err-already-contributed-this-round (err u405))
(define-constant err-already-received-payout (err u406))
(define-constant err-round-not-complete (err u407))
(define-constant err-no-members (err u408))

;; Data Variables
(define-data-var pool-name (string-utf8 100) u"Community Pool")
(define-data-var contribution-amount uint u10000000) ;; 10 STX default
(define-data-var cycle-blocks uint u1008) ;; 7 days default
(define-data-var max-members uint u10)
(define-data-var current-round uint u0)
(define-data-var round-start-height uint u0)
(define-data-var total-members uint u0)
(define-data-var initialized bool false)

;; Data Maps
(define-map members principal bool)
(define-map member-list uint principal)
(define-map member-index principal uint)
(define-map round-contributions 
  { member: principal, round: uint }
  bool
)
(define-map received-payout principal bool)

;; Initialize pool with custom parameters
(define-public (initialize-pool 
  (name (string-utf8 100))
  (contrib-amount uint)
  (cycle-blks uint)
  (max-mems uint))
  (begin
    (asserts! (not (var-get initialized)) (err u409))
    (var-set pool-name name)
    (var-set contribution-amount contrib-amount)
    (var-set cycle-blocks cycle-blks)
    (var-set max-members max-mems)
    (var-set round-start-height burn-block-height)
    (var-set initialized true)
    (ok true))
)

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

(define-read-only (get-pool-name)
  (var-get pool-name)
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
        (current-height burn-block-height)
        (cycle (var-get cycle-blocks)))
    (if (> start-height u0)
      (>= (- current-height start-height) cycle)
      false))
)

;; Join the ROSCA pool
(define-public (join-pool)
  (let ((caller tx-sender)
        (current-index (var-get total-members)))
    (asserts! (var-get initialized) (err u410))
    (asserts! (not (is-member caller)) (err u403))
    (asserts! (< current-index (var-get max-members)) (err u411))
    
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

;; Contribute to the pool
(define-public (contribute)
  (let (
    (caller tx-sender)
    (round (var-get current-round))
    (amount (var-get contribution-amount))
  )
    (asserts! (var-get initialized) (err u410))
    (asserts! (is-member caller) err-not-member)
    (asserts! (not (has-contributed-this-round caller)) err-already-contributed-this-round)
    
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    
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

;; Distribute pot to this round's recipient
(define-public (distribute-pot)
  (let (
    (round (var-get current-round))
    (total (var-get total-members))
    (recipient-index (mod round total))
    (recipient (unwrap! (map-get? member-list recipient-index) err-no-members))
    (pot-amount (stx-get-balance (as-contract tx-sender)))
  )
    (asserts! (can-distribute) err-round-not-complete)
    (asserts! (or (is-eq tx-sender contract-owner) 
                  (is-eq tx-sender recipient)) 
              err-not-authorized)
    (asserts! (not (has-received-payout recipient)) err-already-received-payout)
    
    (try! (as-contract (stx-transfer? pot-amount tx-sender recipient)))
    
    (map-set received-payout recipient true)
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
