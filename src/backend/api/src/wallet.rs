use candid::{CandidType, Deserialize, Nat, Principal};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct TransferTokenRequest {
    pub ledger_canister_id: Principal,
    pub to: Principal,
    pub amount: Nat,
}

pub type TransferTokenResponse = Nat;
