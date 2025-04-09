use std::fmt;

use candid::{CandidType, Deserialize, Nat, Principal};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct TransferTokenRequest {
    pub ledger_canister_id: Principal,
    pub to: Principal,
    pub amount: Nat,
}

impl fmt::Display for TransferTokenRequest {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Amount: {}, To: {}, Ledger canister id: {}",
            self.amount, self.to, self.ledger_canister_id
        )
    }
}

pub type TransferTokenResponse = Nat;
