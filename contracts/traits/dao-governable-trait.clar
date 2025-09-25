;; DAO Governable Trait
;; Standard interface for contracts that can be governed by the DAO

(define-trait dao-governable-trait
  (
    ;; Set the DAO contract address (only callable by current DAO or during initialization)
    (set-dao-address (principal) (response bool uint))

    ;; Get the current DAO contract address
    (get-dao-address () (response principal uint))

    ;; Emergency pause function (callable by DAO or guardian)
    (set-paused (bool) (response bool uint))

    ;; Check if contract is paused
    (is-paused () (response bool uint))

    ;; Set guardian address (only callable by DAO)
    (set-guardian (principal) (response bool uint))

    ;; Get current guardian address
    (get-guardian () (response principal uint))
  )
)
