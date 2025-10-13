;; Simple Governance Contract for Pool Members
;; Uses STX balance for voting power instead of governance tokens

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u404))
(define-constant ERR_PROPOSAL_NOT_ACTIVE (err u406))
(define-constant ERR_ALREADY_VOTED (err u407))
(define-constant ERR_INSUFFICIENT_BALANCE (err u408))
(define-constant ERR_NOT_POOL_MEMBER (err u409))

;; Proposal states
(define-constant PROPOSAL_STATE_PENDING u0)
(define-constant PROPOSAL_STATE_ACTIVE u1)
(define-constant PROPOSAL_STATE_DEFEATED u3)
(define-constant PROPOSAL_STATE_SUCCEEDED u4)

;; Data variables
(define-data-var proposal-count uint u0)
(define-data-var voting-period uint u17280) ;; ~3 days in blocks
(define-data-var min-stx-balance uint u1000000) ;; 1 STX minimum to vote

;; Storage maps
(define-map proposals
  uint
  {
    proposer: principal,
    title: (string-utf8 256),
    description: (string-utf8 1024),
    proposal-type: (string-ascii 64),
    amount: uint,
    recipient: (optional principal),
    start-block: uint,
    end-block: uint,
    for-votes: uint,
    against-votes: uint,
    abstain-votes: uint,
    status: uint
  }
)

(define-map votes
  {proposal-id: uint, voter: principal}
  {support: uint, votes: uint}
)

;; Pool membership tracking (simplified)
(define-map pool-members principal bool)

;; Helper functions
(define-private (get-stx-balance (user principal))
  (stx-get-balance user)
)

(define-private (is-pool-member (user principal))
  (default-to false (map-get? pool-members user))
)

;; Admin functions
(define-public (add-pool-member (member principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set pool-members member true)
    (ok true)
  )
)

(define-public (remove-pool-member (member principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-delete pool-members member)
    (ok true)
  )
)

;; Proposal creation
(define-public (create-proposal 
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type (string-ascii 64))
  (amount uint)
  (recipient (optional principal))
)
  (let (
    (proposal-id (+ (var-get proposal-count) u1))
    (start-block burn-block-height)
    (end-block (+ start-block (var-get voting-period)))
    (user-balance (get-stx-balance tx-sender))
  )
    ;; Check if user is pool member or has minimum STX
    (asserts! (or (is-pool-member tx-sender) (>= user-balance (var-get min-stx-balance))) ERR_NOT_POOL_MEMBER)
    
    ;; Create proposal
    (map-set proposals proposal-id {
      proposer: tx-sender,
      title: title,
      description: description,
      proposal-type: proposal-type,
      amount: amount,
      recipient: recipient,
      start-block: start-block,
      end-block: end-block,
      for-votes: u0,
      against-votes: u0,
      abstain-votes: u0,
      status: PROPOSAL_STATE_ACTIVE
    })
    
    (var-set proposal-count proposal-id)
    (print {event: "proposal-created", proposal-id: proposal-id, proposer: tx-sender})
    (ok proposal-id)
  )
)

;; Voting
(define-public (cast-vote (proposal-id uint) (support uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR_PROPOSAL_NOT_FOUND))
    (voter-balance (get-stx-balance tx-sender))
    (vote-key {proposal-id: proposal-id, voter: tx-sender})
    (existing-vote (map-get? votes vote-key))
  )
    ;; Check if proposal is active
    (asserts! (is-eq (get status proposal) PROPOSAL_STATE_ACTIVE) ERR_PROPOSAL_NOT_ACTIVE)
    (asserts! (<= burn-block-height (get end-block proposal)) ERR_PROPOSAL_NOT_ACTIVE)
    
    ;; Check if user hasn't voted
    (asserts! (is-none existing-vote) ERR_ALREADY_VOTED)
    
    ;; Check if user is pool member or has minimum STX
    (asserts! (or (is-pool-member tx-sender) (>= voter-balance (var-get min-stx-balance))) ERR_NOT_POOL_MEMBER)
    
    ;; Use STX balance as voting power (scaled down)
    (let ((voting-power (/ voter-balance u1000000))) ;; 1 vote per STX
      ;; Record vote
      (map-set votes vote-key {support: support, votes: voting-power})
      
      ;; Update proposal vote counts
      (map-set proposals proposal-id 
        (merge proposal {
          for-votes: (if (is-eq support u1) (+ (get for-votes proposal) voting-power) (get for-votes proposal)),
          against-votes: (if (is-eq support u0) (+ (get against-votes proposal) voting-power) (get against-votes proposal)),
          abstain-votes: (if (is-eq support u2) (+ (get abstain-votes proposal) voting-power) (get abstain-votes proposal))
        })
      )
      
      (print {event: "vote-cast", voter: tx-sender, proposal-id: proposal-id, support: support, votes: voting-power})
      (ok true)
    )
  )
)

;; Read-only functions
(define-read-only (get-proposal-count)
  (var-get proposal-count)
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes {proposal-id: proposal-id, voter: voter})
)

(define-read-only (has-voted (proposal-id uint) (voter principal))
  (is-some (map-get? votes {proposal-id: proposal-id, voter: voter}))
)

(define-read-only (get-voting-period)
  (var-get voting-period)
)

(define-read-only (is-member (user principal))
  (is-pool-member user)
)

(define-read-only (get-user-voting-power (user principal))
  (/ (get-stx-balance user) u1000000)
)
