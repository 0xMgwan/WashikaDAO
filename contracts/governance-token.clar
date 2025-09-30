;; WashikaDAO Governance Token (WASHA)
;; SIP-010 compliant token with delegation and voting checkpoints

(impl-trait .sip010-ft-trait.sip010-ft-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_INVALID_AMOUNT (err u403))
(define-constant ERR_INVALID_RECIPIENT (err u404))
(define-constant ERR_SELF_DELEGATION (err u405))

;; Token configuration
(define-constant TOKEN_NAME "WashikaDAO Token")
(define-constant TOKEN_SYMBOL "WASHA")
(define-constant TOKEN_DECIMALS u6)
(define-constant TOKEN_URI u"https://washikadao.org/token-metadata.json")

;; Data variables
(define-data-var total-supply uint u0)
(define-data-var dao-address (optional principal) none)

;; Storage maps
(define-map balances principal uint)
(define-map allowances {owner: principal, spender: principal} uint)

;; Delegation storage
(define-map delegates principal principal)
(define-map checkpoints {owner: principal, index: uint} {burn-block-height: uint, votes: uint})
(define-map num-checkpoints principal uint)

;; Events
(define-private (emit-transfer (sender principal) (recipient principal) (amount uint))
  (print {
    event: "transfer",
    sender: sender,
    recipient: recipient,
    amount: amount,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-delegate-changed (delegator principal) (from-delegate principal) (to-delegate principal))
  (print {
    event: "delegate-changed",
    delegator: delegator,
    from-delegate: from-delegate,
    to-delegate: to-delegate,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-delegate-votes-changed (delegate principal) (previous-balance uint) (new-balance uint))
  (print {
    event: "delegate-votes-changed",
    delegate: delegate,
    previous-balance: previous-balance,
    new-balance: new-balance,
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

;; SIP-010 Implementation
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (is-eq sender recipient)) ERR_INVALID_RECIPIENT)
    
    (let ((sender-balance (get-balance-of sender)))
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Update balances
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (get-balance-of recipient) amount))
      
      ;; Update voting power
      (try! (move-delegates sender recipient amount))
      
      ;; Emit event
      (emit-transfer sender recipient amount)
      (ok true)
    )
  )
)

(define-read-only (get-name)
  (ok TOKEN_NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

(define-read-only (get-balance (who principal))
  (ok (get-balance-of who))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

(define-read-only (get-token-uri)
  (ok (some TOKEN_URI))
)

;; Internal balance helper
(define-private (get-balance-of (who principal))
  (default-to u0 (map-get? balances who))
)

;; Minting and burning (only DAO)
(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Update balance and total supply
    (map-set balances recipient (+ (get-balance-of recipient) amount))
    (var-set total-supply (+ (var-get total-supply) amount))
    
    ;; Update voting power
    (try! (move-delegates recipient recipient amount))
    
    ;; Emit event
    (emit-transfer tx-sender recipient amount)
    (ok true)
  )
)

(define-public (burn (amount uint))
  (let ((sender-balance (get-balance-of tx-sender)))
    (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Update balance and total supply
    (map-set balances tx-sender (- sender-balance amount))
    (var-set total-supply (- (var-get total-supply) amount))
    
    ;; Update voting power
    (try! (move-delegates tx-sender tx-sender (- u0 amount)))
    
    ;; Emit event
    (emit-transfer tx-sender tx-sender amount)
    (ok true)
  )
)

;; DAO management
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set dao-address (some new-dao))
    (ok true)
  )
)

(define-read-only (get-dao-address)
  (var-get dao-address)
)

;; Delegation functions
(define-public (delegate (to principal))
  (begin
    (asserts! (not (is-eq tx-sender to)) ERR_SELF_DELEGATION)
    
    (let (
      (current-delegate (get-delegate tx-sender))
      (delegator-balance (get-balance-of tx-sender))
    )
      ;; Remove votes from current delegate
      (if (not (is-eq current-delegate tx-sender))
        (try! (move-delegate-votes current-delegate (- u0 delegator-balance)))
        true
      )
      
      ;; Set new delegate
      (map-set delegates tx-sender to)
      
      ;; Add votes to new delegate
      (try! (move-delegate-votes to delegator-balance))
      
      ;; Emit event
      (emit-delegate-changed tx-sender current-delegate to)
      (ok true)
    )
  )
)

(define-read-only (get-delegate (delegator principal))
  (default-to delegator (map-get? delegates delegator))
)

;; Voting power functions
(define-read-only (get-current-votes (account principal))
  (let ((num-checkpoints-account (default-to u0 (map-get? num-checkpoints account))))
    (if (> num-checkpoints-account u0)
      (get votes (unwrap-panic (map-get? checkpoints {owner: account, index: (- num-checkpoints-account u1)})))
      u0
    )
  )
)

(define-read-only (get-prior-votes (account principal) (burn-block-height uint))
  (let ((num-checkpoints-account (default-to u0 (map-get? num-checkpoints account))))
    (if (is-eq num-checkpoints-account u0)
      u0
      (let ((checkpoint-0 (unwrap-panic (map-get? checkpoints {owner: account, index: u0}))))
        (if (> (get burn-block-height checkpoint-0) burn-block-height)
          u0
          (let ((checkpoint-last (unwrap-panic (map-get? checkpoints {owner: account, index: (- num-checkpoints-account u1)}))))
            (if (<= (get burn-block-height checkpoint-last) burn-block-height)
              (get votes checkpoint-last)
              ;; Binary search would go here for efficiency
              ;; For now, linear search from the end
              (get-votes-at-block account burn-block-height (- num-checkpoints-account u1))
            )
          )
        )
      )
    )
  )
)

;; Helper for binary search (simplified linear search for now)
(define-private (get-votes-at-block (account principal) (target-block uint) (high uint))
  (let ((checkpoint (unwrap-panic (map-get? checkpoints {owner: account, index: high}))))
    (if (<= (get burn-block-height checkpoint) target-block)
      (get votes checkpoint)
      (if (is-eq high u0)
        u0
        (get-votes-at-block account target-block (- high u1))
      )
    )
  )
)

;; Internal delegation helpers
(define-private (move-delegates (src-rep principal) (dst-rep principal) (amount uint))
  (begin
    (if (not (is-eq src-rep dst-rep))
      (begin
        (if (not (is-eq src-rep tx-sender))
          (try! (move-delegate-votes src-rep (- u0 amount)))
          true
        )
        (if (not (is-eq dst-rep tx-sender))
          (try! (move-delegate-votes dst-rep amount))
          true
        )
      )
      true
    )
    (ok true)
  )
)

(define-private (move-delegate-votes (delegate principal) (amount uint))
  (let (
    (old-votes (get-current-votes delegate))
    (new-votes (if (< amount u0) 
                  (if (> old-votes (- u0 amount)) (- old-votes (- u0 amount)) u0)
                  (+ old-votes amount)))
  )
    (try! (write-checkpoint delegate new-votes))
    (emit-delegate-votes-changed delegate old-votes new-votes)
    (ok true)
  )
)

(define-private (write-checkpoint (delegate principal) (new-votes uint))
  (let (
    (num-checkpoints-delegate (default-to u0 (map-get? num-checkpoints delegate)))
    (current-block burn-block-height)
  )
    (if (and (> num-checkpoints-delegate u0)
             (is-eq (get burn-block-height (unwrap-panic (map-get? checkpoints {owner: delegate, index: (- num-checkpoints-delegate u1)}))) current-block))
      ;; Update existing checkpoint for this block
      (map-set checkpoints {owner: delegate, index: (- num-checkpoints-delegate u1)} {burn-block-height: current-block, votes: new-votes})
      ;; Create new checkpoint
      (begin
        (map-set checkpoints {owner: delegate, index: num-checkpoints-delegate} {burn-block-height: current-block, votes: new-votes})
        (map-set num-checkpoints delegate (+ num-checkpoints-delegate u1))
      )
    )
    (ok true)
  )
)
