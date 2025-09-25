;; WashikaDAO Core Contract
;; Handles proposal creation, voting, and execution

(impl-trait .dao-governable-trait.dao-governable-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_PROPOSAL_NOT_FOUND (err u404))
(define-constant ERR_PROPOSAL_EXPIRED (err u405))
(define-constant ERR_PROPOSAL_NOT_ACTIVE (err u406))
(define-constant ERR_ALREADY_VOTED (err u407))
(define-constant ERR_INSUFFICIENT_VOTES (err u408))
(define-constant ERR_PROPOSAL_NOT_SUCCEEDED (err u409))
(define-constant ERR_PROPOSAL_ALREADY_EXECUTED (err u410))
(define-constant ERR_TIMELOCK_NOT_READY (err u411))
(define-constant ERR_INVALID_PROPOSAL (err u412))
(define-constant ERR_BELOW_THRESHOLD (err u413))

;; Proposal states
(define-constant PROPOSAL_STATE_PENDING u0)
(define-constant PROPOSAL_STATE_ACTIVE u1)
(define-constant PROPOSAL_STATE_CANCELED u2)
(define-constant PROPOSAL_STATE_DEFEATED u3)
(define-constant PROPOSAL_STATE_SUCCEEDED u4)
(define-constant PROPOSAL_STATE_QUEUED u5)
(define-constant PROPOSAL_STATE_EXPIRED u6)
(define-constant PROPOSAL_STATE_EXECUTED u7)

;; Data variables
(define-data-var proposal-count uint u0)
(define-data-var governance-token principal .governance-token)
(define-data-var timelock-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)

;; Governance parameters
(define-data-var voting-delay uint u1) ;; blocks
(define-data-var voting-period uint u17280) ;; ~3 days in blocks (assuming 15s blocks)
(define-data-var proposal-threshold uint u100000000) ;; 100 WASHA (6 decimals)
(define-data-var quorum-votes uint u500000000) ;; 500 WASHA (6 decimals)

;; Storage maps
(define-map proposals
  uint
  {
    proposer: principal,
    start-block: uint,
    end-block: uint,
    for-votes: uint,
    against-votes: uint,
    abstain-votes: uint,
    canceled: bool,
    executed: bool,
    eta: uint,
    targets: (list 10 principal),
    values: (list 10 uint),
    signatures: (list 10 (string-ascii 256)),
    calldatas: (list 10 (buff 2048)),
    description: (string-utf8 1024)
  }
)

(define-map receipts
  {proposal-id: uint, voter: principal}
  {has-voted: bool, support: uint, votes: uint}
)

;; Events
(define-private (emit-proposal-created (proposal-id uint) (proposer principal) (targets (list 10 principal)) (description (string-utf8 1024)))
  (print {
    event: "proposal-created",
    proposal-id: proposal-id,
    proposer: proposer,
    targets: targets,
    description: description,
    start-block: (+ block-height (var-get voting-delay)),
    end-block: (+ block-height (var-get voting-delay) (var-get voting-period)),
    block-height: block-height
  })
)

(define-private (emit-vote-cast (voter principal) (proposal-id uint) (support uint) (votes uint))
  (print {
    event: "vote-cast",
    voter: voter,
    proposal-id: proposal-id,
    support: support,
    votes: votes,
    block-height: block-height
  })
)

(define-private (emit-proposal-queued (proposal-id uint) (eta uint))
  (print {
    event: "proposal-queued",
    proposal-id: proposal-id,
    eta: eta,
    block-height: block-height
  })
)

(define-private (emit-proposal-executed (proposal-id uint))
  (print {
    event: "proposal-executed",
    proposal-id: proposal-id,
    block-height: block-height
  })
)

;; Authorization helpers
(define-private (is-dao-or-owner)
  (or (is-eq tx-sender CONTRACT_OWNER) (is-eq contract-caller (as-contract tx-sender)))
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
    ;; DAO address is this contract itself
    (ok true)
  )
)

(define-read-only (get-dao-address)
  (ok (as-contract tx-sender))
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

;; Governance parameter management
(define-public (set-voting-delay (new-delay uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set voting-delay new-delay)
    (ok true)
  )
)

(define-public (set-voting-period (new-period uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set voting-period new-period)
    (ok true)
  )
)

(define-public (set-proposal-threshold (new-threshold uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set proposal-threshold new-threshold)
    (ok true)
  )
)

(define-public (set-quorum-votes (new-quorum uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set quorum-votes new-quorum)
    (ok true)
  )
)

(define-public (set-timelock-address (new-timelock principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set timelock-address (some new-timelock))
    (ok true)
  )
)

;; Read-only getters
(define-read-only (get-voting-delay)
  (var-get voting-delay)
)

(define-read-only (get-voting-period)
  (var-get voting-period)
)

(define-read-only (get-proposal-threshold)
  (var-get proposal-threshold)
)

(define-read-only (get-quorum-votes)
  (var-get quorum-votes)
)

(define-read-only (get-timelock-address)
  (var-get timelock-address)
)

;; Proposal creation
(define-public (propose 
  (targets (list 10 principal))
  (values (list 10 uint))
  (signatures (list 10 (string-ascii 256)))
  (calldatas (list 10 (buff 2048)))
  (description (string-utf8 1024))
)
  (let (
    (proposer-votes (unwrap-panic (contract-call? .governance-token get-prior-votes tx-sender (- block-height u1))))
    (proposal-id (+ (var-get proposal-count) u1))
    (start-block (+ block-height (var-get voting-delay)))
    (end-block (+ start-block (var-get voting-period)))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (>= proposer-votes (var-get proposal-threshold)) ERR_BELOW_THRESHOLD)
    (asserts! (> (len targets) u0) ERR_INVALID_PROPOSAL)
    (asserts! (is-eq (len targets) (len values)) ERR_INVALID_PROPOSAL)
    (asserts! (is-eq (len targets) (len signatures)) ERR_INVALID_PROPOSAL)
    (asserts! (is-eq (len targets) (len calldatas)) ERR_INVALID_PROPOSAL)
    
    ;; Create proposal
    (map-set proposals proposal-id {
      proposer: tx-sender,
      start-block: start-block,
      end-block: end-block,
      for-votes: u0,
      against-votes: u0,
      abstain-votes: u0,
      canceled: false,
      executed: false,
      eta: u0,
      targets: targets,
      values: values,
      signatures: signatures,
      calldatas: calldatas,
      description: description
    })
    
    (var-set proposal-count proposal-id)
    (emit-proposal-created proposal-id tx-sender targets description)
    (ok proposal-id)
  )
)

;; Voting
(define-public (cast-vote (proposal-id uint) (support uint))
  (cast-vote-with-reason proposal-id support u"")
)

(define-public (cast-vote-with-reason (proposal-id uint) (support uint) (reason (string-utf8 512)))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR_PROPOSAL_NOT_FOUND))
    (voter-votes (unwrap-panic (contract-call? .governance-token get-prior-votes tx-sender (get start-block proposal))))
    (receipt-key {proposal-id: proposal-id, voter: tx-sender})
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get-proposal-state proposal-id) PROPOSAL_STATE_ACTIVE) ERR_PROPOSAL_NOT_ACTIVE)
    (asserts! (is-none (map-get? receipts receipt-key)) ERR_ALREADY_VOTED)
    (asserts! (> voter-votes u0) ERR_INSUFFICIENT_VOTES)
    (asserts! (<= support u2) ERR_INVALID_PROPOSAL) ;; 0=against, 1=for, 2=abstain
    
    ;; Record vote
    (map-set receipts receipt-key {
      has-voted: true,
      support: support,
      votes: voter-votes
    })
    
    ;; Update proposal vote counts
    (map-set proposals proposal-id 
      (merge proposal {
        for-votes: (if (is-eq support u1) (+ (get for-votes proposal) voter-votes) (get for-votes proposal)),
        against-votes: (if (is-eq support u0) (+ (get against-votes proposal) voter-votes) (get against-votes proposal)),
        abstain-votes: (if (is-eq support u2) (+ (get abstain-votes proposal) voter-votes) (get abstain-votes proposal))
      })
    )
    
    (emit-vote-cast tx-sender proposal-id support voter-votes)
    (ok true)
  )
)

;; Queue proposal (move to timelock)
(define-public (queue (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR_PROPOSAL_NOT_FOUND))
    (timelock (unwrap! (var-get timelock-address) ERR_UNAUTHORIZED))
    (eta (+ block-height u144)) ;; ~24 hours delay
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get-proposal-state proposal-id) PROPOSAL_STATE_SUCCEEDED) ERR_PROPOSAL_NOT_SUCCEEDED)
    
    ;; Update proposal with eta
    (map-set proposals proposal-id (merge proposal {eta: eta}))
    
    ;; Queue in timelock (would call timelock contract here)
    (emit-proposal-queued proposal-id eta)
    (ok true)
  )
)

;; Execute proposal
(define-public (execute (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR_PROPOSAL_NOT_FOUND))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get-proposal-state proposal-id) PROPOSAL_STATE_QUEUED) ERR_PROPOSAL_NOT_SUCCEEDED)
    (asserts! (>= block-height (get eta proposal)) ERR_TIMELOCK_NOT_READY)
    (asserts! (not (get executed proposal)) ERR_PROPOSAL_ALREADY_EXECUTED)
    
    ;; Mark as executed
    (map-set proposals proposal-id (merge proposal {executed: true}))
    
    ;; Execute calls (simplified - in practice would iterate through targets/calls)
    (emit-proposal-executed proposal-id)
    (ok true)
  )
)

;; Cancel proposal
(define-public (cancel (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR_PROPOSAL_NOT_FOUND))
    (proposer-votes (unwrap-panic (contract-call? .governance-token get-current-votes (get proposer proposal))))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (or 
      (is-eq tx-sender (get proposer proposal))
      (< proposer-votes (var-get proposal-threshold))
      (is-guardian-or-dao)
    ) ERR_UNAUTHORIZED)
    
    (map-set proposals proposal-id (merge proposal {canceled: true}))
    (ok true)
  )
)

;; State calculation
(define-read-only (get-proposal-state (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR_PROPOSAL_NOT_FOUND))
  )
    (if (get canceled proposal)
      PROPOSAL_STATE_CANCELED
      (if (get executed proposal)
        PROPOSAL_STATE_EXECUTED
        (if (< block-height (get start-block proposal))
          PROPOSAL_STATE_PENDING
          (if (<= block-height (get end-block proposal))
            PROPOSAL_STATE_ACTIVE
            (if (< (get for-votes proposal) (var-get quorum-votes))
              PROPOSAL_STATE_DEFEATED
              (if (<= (get for-votes proposal) (get against-votes proposal))
                PROPOSAL_STATE_DEFEATED
                (if (is-eq (get eta proposal) u0)
                  PROPOSAL_STATE_SUCCEEDED
                  (if (< (+ (get eta proposal) u17280) block-height) ;; 3 day expiry
                    PROPOSAL_STATE_EXPIRED
                    PROPOSAL_STATE_QUEUED
                  )
                )
              )
            )
          )
        )
      )
    )
  )
)

;; Getters
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-receipt (proposal-id uint) (voter principal))
  (map-get? receipts {proposal-id: proposal-id, voter: voter})
)

(define-read-only (get-proposal-count)
  (var-get proposal-count)
)
