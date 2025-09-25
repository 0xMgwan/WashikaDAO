;; WashikaDAO Kink Interest Rate Model
;; Implements a kinked interest rate model for lending markets

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INVALID_PARAMETER (err u402))

;; Scaling factors
(define-constant SCALE_FACTOR u1000000000000000000) ;; 18 decimals
(define-constant BLOCKS_PER_YEAR u52560) ;; ~10 min blocks

;; Data variables
(define-data-var dao-address (optional principal) none)

;; Model parameters (18 decimal precision)
(define-data-var base-rate-per-year uint u20000000000000000) ;; 2% base rate
(define-data-var multiplier-per-year uint u100000000000000000) ;; 10% multiplier before kink
(define-data-var jump-multiplier-per-year uint u1090000000000000000) ;; 109% jump multiplier after kink
(define-data-var kink uint u800000000000000000) ;; 80% utilization kink point

;; Authorization
(define-private (is-dao-or-owner)
  (or 
    (is-eq tx-sender CONTRACT_OWNER)
    (match (var-get dao-address)
      dao (is-eq tx-sender dao)
      false
    )
  )
)

;; Configuration
(define-public (set-dao-address (new-dao principal))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (var-set dao-address (some new-dao))
    (ok true)
  )
)

(define-public (update-model (base-rate uint) (multiplier uint) (jump-multiplier uint) (kink-point uint))
  (begin
    (asserts! (is-dao-or-owner) ERR_UNAUTHORIZED)
    (asserts! (<= kink-point SCALE_FACTOR) ERR_INVALID_PARAMETER)
    (asserts! (<= base-rate SCALE_FACTOR) ERR_INVALID_PARAMETER)
    
    (var-set base-rate-per-year base-rate)
    (var-set multiplier-per-year multiplier)
    (var-set jump-multiplier-per-year jump-multiplier)
    (var-set kink kink-point)
    (ok true)
  )
)

;; Core interest rate calculation
(define-read-only (get-borrow-rate (cash uint) (borrows uint) (reserves uint))
  (let ((utilization (get-utilization-rate cash borrows reserves)))
    (if (<= utilization (var-get kink))
      ;; Below kink: base + utilization * multiplier
      (+ (/ (var-get base-rate-per-year) BLOCKS_PER_YEAR)
         (/ (* utilization (var-get multiplier-per-year)) (* BLOCKS_PER_YEAR SCALE_FACTOR)))
      ;; Above kink: base + kink * multiplier + (utilization - kink) * jump_multiplier
      (let (
        (base-rate (/ (var-get base-rate-per-year) BLOCKS_PER_YEAR))
        (normal-rate (/ (* (var-get kink) (var-get multiplier-per-year)) (* BLOCKS_PER_YEAR SCALE_FACTOR)))
        (excess-util (- utilization (var-get kink)))
        (jump-rate (/ (* excess-util (var-get jump-multiplier-per-year)) (* BLOCKS_PER_YEAR SCALE_FACTOR)))
      )
        (+ base-rate (+ normal-rate jump-rate))
      )
    )
  )
)

(define-read-only (get-supply-rate (cash uint) (borrows uint) (reserves uint) (reserve-factor uint))
  (let (
    (one-minus-reserve-factor (- SCALE_FACTOR reserve-factor))
    (borrow-rate (get-borrow-rate cash borrows reserves))
    (rate-to-pool (/ (* borrow-rate one-minus-reserve-factor) SCALE_FACTOR))
  )
    (/ (* (get-utilization-rate cash borrows reserves) rate-to-pool) SCALE_FACTOR)
  )
)

;; Utilization rate calculation
(define-read-only (get-utilization-rate (cash uint) (borrows uint) (reserves uint))
  (if (is-eq borrows u0)
    u0
    (let ((total-supply (+ cash borrows)))
      (if (is-eq total-supply u0)
        u0
        (/ (* borrows SCALE_FACTOR) total-supply)
      )
    )
  )
)

;; APY calculations (for frontend display)
(define-read-only (get-borrow-apy (cash uint) (borrows uint) (reserves uint))
  (let ((rate-per-block (get-borrow-rate cash borrows reserves)))
    ;; APY = (1 + rate)^blocks_per_year - 1
    ;; Simplified approximation: rate * blocks_per_year
    (* rate-per-block BLOCKS_PER_YEAR)
  )
)

(define-read-only (get-supply-apy (cash uint) (borrows uint) (reserves uint) (reserve-factor uint))
  (let ((rate-per-block (get-supply-rate cash borrows reserves reserve-factor)))
    (* rate-per-block BLOCKS_PER_YEAR)
  )
)

;; Model parameters getters
(define-read-only (get-model-parameters)
  {
    base-rate-per-year: (var-get base-rate-per-year),
    multiplier-per-year: (var-get multiplier-per-year),
    jump-multiplier-per-year: (var-get jump-multiplier-per-year),
    kink: (var-get kink)
  }
)

;; Rate calculation for specific utilization
(define-read-only (get-rates-at-utilization (utilization uint))
  (let (
    ;; Simulate market conditions for given utilization
    (total-supply u1000000000000000000) ;; 1 unit
    (borrows (/ (* utilization total-supply) SCALE_FACTOR))
    (cash (- total-supply borrows))
    (reserves u0)
    (reserve-factor u100000000000000000) ;; 10%
  )
    {
      utilization: utilization,
      borrow-rate: (get-borrow-rate cash borrows reserves),
      supply-rate: (get-supply-rate cash borrows reserves reserve-factor),
      borrow-apy: (get-borrow-apy cash borrows reserves),
      supply-apy: (get-supply-apy cash borrows reserves reserve-factor)
    }
  )
)
