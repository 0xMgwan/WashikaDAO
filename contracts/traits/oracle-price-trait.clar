;; Oracle Price Trait
;; Standard interface for price oracles in WashikaDAO

(define-trait oracle-price-trait
  (
    ;; Get the current price for a trading pair
    ;; Returns price in 8 decimal format (e.g., 100000000 = $1.00)
    (get-price ((string-ascii 16)) (response uint uint))

    ;; Get the timestamp when the price was last updated
    (get-updated-at ((string-ascii 16)) (response uint uint))

    ;; Check if a price is stale (older than max age)
    (is-price-stale ((string-ascii 16) uint) (response bool uint))

    ;; Get price with staleness check
    (get-price-safe ((string-ascii 16) uint) (response uint uint))
  )
)
