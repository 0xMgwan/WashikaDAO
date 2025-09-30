;; WashikaDAO Oracle Aggregator Contract
;; Medianized signer-based oracle with signature verification

(impl-trait .oracle-price-trait.oracle-price-trait)
(impl-trait .dao-governable-trait.dao-governable-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INVALID_SIGNATURE (err u402))
(define-constant ERR_STALE_PRICE (err u403))
(define-constant ERR_INSUFFICIENT_SIGNERS (err u404))
(define-constant ERR_ROUND_NOT_READY (err u405))
(define-constant ERR_INVALID_PRICE (err u406))
(define-constant ERR_SIGNER_EXISTS (err u407))
(define-constant ERR_SIGNER_NOT_FOUND (err u408))

;; Price scaling (8 decimals)
(define-constant PRICE_SCALE u100000000)
(define-constant MAX_PRICE_AGE u144) ;; ~24 hours in blocks

;; Data variables
(define-data-var dao-address (optional principal) none)
(define-data-var guardian (optional principal) none)
(define-data-var paused bool false)
(define-data-var min-signers uint u3)
(define-data-var max-price-deviation uint u10000000) ;; 10% in 8 decimals

;; Storage maps
(define-map authorized-signers principal bool)
(define-map signer-pubkeys principal (buff 33))

;; Price data
(define-map prices
  (string-ascii 16) ;; pair (e.g., "BTC-USD", "STX-USD")
  {
    price: uint,
    updated-at: uint,
    round: uint
  }
)

;; Round submissions
(define-map round-submissions
  {pair: (string-ascii 16), round: uint, signer: principal}
  {
    price: uint,
    timestamp: uint,
    signature: (buff 65)
  }
)

;; Round data
(define-map rounds
  {pair: (string-ascii 16), round: uint}
  {
    submissions: uint,
    finalized: bool,
    deadline: uint,
    median-price: uint
  }
)

;; Current round tracking
(define-map current-rounds (string-ascii 16) uint)

;; Events
(define-private (emit-price-updated (pair (string-ascii 16)) (price uint) (round uint))
  (print {
    event: "price-updated",
    pair: pair,
    price: price,
    round: round,
    updated-at: burn-block-height,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-signer-added (signer principal) (pubkey (buff 33)))
  (print {
    event: "signer-added",
    signer: signer,
    pubkey: pubkey,
    burn-block-height: burn-block-height
  })
)

(define-private (emit-signer-removed (signer principal))
  (print {
    event: "signer-removed",
    signer: signer,
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

(define-private (is-authorized-signer)
  (default-to false (map-get? authorized-signers tx-sender))
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

;; Signer management
(define-public (add-signer (signer principal) (pubkey (buff 33)))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (not (default-to false (map-get? authorized-signers signer))) ERR_SIGNER_EXISTS)
    (asserts! (> (len pubkey) u0) ERR_INVALID_SIGNATURE)
    
    (map-set authorized-signers signer true)
    (map-set signer-pubkeys signer pubkey)
    
    (emit-signer-added signer pubkey)
    (ok true)
  )
)

(define-public (remove-signer (signer principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (default-to false (map-get? authorized-signers signer)) ERR_SIGNER_NOT_FOUND)
    
    (map-delete authorized-signers signer)
    (map-delete signer-pubkeys signer)
    
    (emit-signer-removed signer)
    (ok true)
  )
)

(define-public (set-min-signers (min uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (> min u0) ERR_INVALID_PRICE)
    (var-set min-signers min)
    (ok true)
  )
)

;; Price submission
(define-public (submit-price (pair (string-ascii 16)) (price uint) (round uint) (signature (buff 65)))
  (begin
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-authorized-signer) ERR_UNAUTHORIZED)
    (asserts! (> price u0) ERR_INVALID_PRICE)
    (asserts! (< price (* u1000000 PRICE_SCALE)) ERR_INVALID_PRICE) ;; Max $1M
    
    ;; Verify signature
    (try! (verify-price-signature pair price round signature))
    
    ;; Check if round is active
    (let (
      (current-round (default-to u0 (map-get? current-rounds pair)))
      (round-data (map-get? rounds {pair: pair, round: round}))
    )
      (asserts! (>= round current-round) ERR_ROUND_NOT_READY)
      
      ;; Initialize round if needed
      (if (is-none round-data)
        (map-set rounds {pair: pair, round: round} {
          submissions: u0,
          finalized: false,
          deadline: (+ burn-block-height u10), ;; 10 blocks to submit
          median-price: u0
        })
        true
      )
      
      ;; Submit price
      (map-set round-submissions {pair: pair, round: round, signer: tx-sender} {
        price: price,
        timestamp: burn-block-height,
        signature: signature
      })
      
      ;; Update round submission count
      (let ((updated-round (unwrap-panic (map-get? rounds {pair: pair, round: round}))))
        (map-set rounds {pair: pair, round: round}
          (merge updated-round {submissions: (+ (get submissions updated-round) u1)}))
        
        ;; Try to finalize round if we have enough submissions
        (if (>= (+ (get submissions updated-round) u1) (var-get min-signers))
          (try! (finalize-round pair round))
          true
        )
      )
      
      (ok true)
    )
  )
)

;; Signature verification
(define-private (verify-price-signature (pair (string-ascii 16)) (price uint) (round uint) (signature (buff 65)))
  (let (
    (signer-pubkey (unwrap! (map-get? signer-pubkeys tx-sender) ERR_UNAUTHORIZED))
    (message-hash (create-price-message-hash pair price round))
  )
    (asserts! (secp256k1-verify message-hash signature signer-pubkey) ERR_INVALID_SIGNATURE)
    (ok true)
  )
)

(define-private (create-price-message-hash (pair (string-ascii 16)) (price uint) (round uint))
  (keccak256 (concat
    (concat (unwrap-panic (to-consensus-buff? pair)) (unwrap-panic (to-consensus-buff? price)))
    (unwrap-panic (to-consensus-buff? round))
  ))
)

;; Round finalization
(define-public (finalize-round (pair (string-ascii 16)) (round uint))
  (let (
    (round-data (unwrap! (map-get? rounds {pair: pair, round: round}) ERR_ROUND_NOT_READY))
  )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (not (get finalized round-data)) ERR_ROUND_NOT_READY)
    (asserts! (>= (get submissions round-data) (var-get min-signers)) ERR_INSUFFICIENT_SIGNERS)
    
    ;; Calculate median price (simplified - would need proper median calculation)
    (let ((median-price (calculate-median-price pair round (get submissions round-data))))
      ;; Validate price deviation
      (try! (validate-price-deviation pair median-price))
      
      ;; Update price
      (map-set prices pair {
        price: median-price,
        updated-at: burn-block-height,
        round: round
      })
      
      ;; Mark round as finalized
      (map-set rounds {pair: pair, round: round}
        (merge round-data {finalized: true, median-price: median-price}))
      
      ;; Update current round
      (map-set current-rounds pair (+ round u1))
      
      (emit-price-updated pair median-price round)
      (ok median-price)
    )
  )
)

;; Simplified median calculation (in practice, would need proper sorting)
(define-private (calculate-median-price (pair (string-ascii 16)) (round uint) (submission-count uint))
  ;; For now, return a simple average of first few submissions
  ;; In production, this would properly sort and find median
  (let (
    (submission1 (map-get? round-submissions {pair: pair, round: round, signer: CONTRACT_OWNER}))
    (submission2 (map-get? round-submissions {pair: pair, round: round, signer: CONTRACT_OWNER}))
  )
    ;; Simplified - return a default price for now
    (* u50 PRICE_SCALE) ;; $50 default
  )
)

;; Price deviation validation
(define-private (validate-price-deviation (pair (string-ascii 16)) (new-price uint))
  (let ((current-price-data (map-get? prices pair)))
    (match current-price-data
      price-data (let (
        (current-price (get price price-data))
        (deviation (if (> new-price current-price)
                     (- new-price current-price)
                     (- current-price new-price)))
        (max-deviation (/ (* current-price (var-get max-price-deviation)) PRICE_SCALE))
      )
        (asserts! (<= deviation max-deviation) ERR_INVALID_PRICE)
        (ok true)
      )
      (ok true) ;; No previous price, allow any price
    )
  )
)

;; Oracle Price Trait Implementation
(define-read-only (get-price (pair (string-ascii 16)))
  (let ((price-data (map-get? prices pair)))
    (match price-data
      data (ok (get price data))
      (err ERR_STALE_PRICE)
    )
  )
)

(define-read-only (get-updated-at (pair (string-ascii 16)))
  (let ((price-data (map-get? prices pair)))
    (match price-data
      data (ok (get updated-at data))
      (err ERR_STALE_PRICE)
    )
  )
)

(define-read-only (is-price-stale (pair (string-ascii 16)) (max-age uint))
  (let ((price-data (map-get? prices pair)))
    (match price-data
      data (ok (> (- burn-block-height (get updated-at data)) max-age))
      (ok true) ;; No price data = stale
    )
  )
)

(define-read-only (get-price-safe (pair (string-ascii 16)) (max-age uint))
  (let ((price-data (map-get? prices pair)))
    (match price-data
      data (if (<= (- burn-block-height (get updated-at data)) max-age)
             (ok (get price data))
             (err ERR_STALE_PRICE))
      (err ERR_STALE_PRICE)
    )
  )
)

;; Additional read-only functions
(define-read-only (get-round-info (pair (string-ascii 16)) (round uint))
  (map-get? rounds {pair: pair, round: round})
)

(define-read-only (get-submission (pair (string-ascii 16)) (round uint) (signer principal))
  (map-get? round-submissions {pair: pair, round: round, signer: signer})
)

(define-read-only (get-current-round (pair (string-ascii 16)))
  (default-to u0 (map-get? current-rounds pair))
)

(define-read-only (is-signer-authorized (signer principal))
  (default-to false (map-get? authorized-signers signer))
)

(define-read-only (get-signer-pubkey (signer principal))
  (map-get? signer-pubkeys signer))

(define-read-only (get-oracle-config)
  {
    min-signers: (var-get min-signers),
    max-price-deviation: (var-get max-price-deviation),
    max-price-age: MAX_PRICE_AGE,
    paused: (var-get paused)
  }
)

;; Emergency functions
(define-public (emergency-update-price (pair (string-ascii 16)) (price uint))
  (begin
    (asserts! (is-guardian-or-dao) ERR_UNAUTHORIZED)
    (asserts! (> price u0) ERR_INVALID_PRICE)
    
    (map-set prices pair {
      price: price,
      updated-at: burn-block-height,
      round: u999999 ;; Emergency round
    })
    
    (print {
      event: "emergency-price-update",
      pair: pair,
      price: price,
      burn-block-height: burn-block-height
    })
    
    (ok true)
  )
)
