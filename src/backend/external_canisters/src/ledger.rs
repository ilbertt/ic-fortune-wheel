use candid::Principal;
use ic_cdk::{api::call::CallResult, call};
use icrc_ledger_types::icrc1::account::Account;

pub struct LedgerCanisterService(pub Principal);

impl LedgerCanisterService {
    pub async fn icrc1_balance_of(&self, account: Account) -> CallResult<u128> {
        let (res,) = call(self.0, "icrc1_balance_of", (account,)).await?;
        Ok(res)
    }
}
