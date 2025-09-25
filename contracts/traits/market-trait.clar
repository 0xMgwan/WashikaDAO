;; Market Trait
;; Standard interface for lending markets in WashikaDAO

(define-trait market-trait
  (
    ;; Accrue interest for the market
    (accrue-interest () (response bool uint))

    ;; Deposit assets to the market
    (deposit (uint) (response bool uint))

    ;; Withdraw assets from the market
    (withdraw (uint) (response bool uint))

    ;; Borrow assets from the market
    (borrow (uint) (response bool uint))

    ;; Repay borrowed assets
    (repay (uint) (response bool uint))

    ;; Get account liquidity (available to borrow) and shortfall (liquidatable)
    (get-account-liquidity (principal) (response {liquidity: uint, shortfall: uint} uint))

    ;; Get current supply balance for an account
    (get-supply-balance (principal) (response uint uint))

    ;; Get current borrow balance for an account
    (get-borrow-balance (principal) (response uint uint))

    ;; Get current supply rate per block
    (get-supply-rate () (response uint uint))

    ;; Get current borrow rate per block
    (get-borrow-rate () (response uint uint))

    ;; Get market utilization rate
    (get-utilization-rate () (response uint uint))

    ;; Get total market supply
    (get-total-supply () (response uint uint))

    ;; Get total market borrows
    (get-total-borrows () (response uint uint))
  )
)
