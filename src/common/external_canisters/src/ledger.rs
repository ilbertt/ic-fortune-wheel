use candid::Principal;
use ic_cdk::{api::call::CallResult, call};

pub use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{BlockIndex, TransferArg, TransferError},
};

pub struct LedgerCanisterService(pub Principal);

impl LedgerCanisterService {
    pub async fn icrc1_balance_of(&self, account: Account) -> CallResult<u128> {
        let (res,) = call(self.0, "icrc1_balance_of", (account,)).await?;
        Ok(res)
    }

    pub async fn icrc1_transfer(
        &self,
        arg0: TransferArg,
    ) -> CallResult<Result<BlockIndex, TransferError>> {
        let (res,) = call(self.0, "icrc1_transfer", (arg0,)).await?;
        Ok(res)
    }
}
