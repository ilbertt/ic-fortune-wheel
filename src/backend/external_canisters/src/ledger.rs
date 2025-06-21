use candid::Principal;
use ic_cdk::call::{Call, CallResult};
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{BlockIndex, TransferArg, TransferError},
};

pub struct LedgerCanisterService(pub Principal);

impl LedgerCanisterService {
    pub async fn icrc1_balance_of(&self, account: Account) -> CallResult<u128> {
        let (res,) = Call::unbounded_wait(self.0, "icrc1_balance_of")
            .with_arg(account)
            .await?
            .candid_tuple()?;
        Ok(res)
    }

    pub async fn icrc1_transfer(
        &self,
        arg0: TransferArg,
    ) -> CallResult<Result<BlockIndex, TransferError>> {
        let (res,) = Call::unbounded_wait(self.0, "icrc1_transfer")
            .with_arg(arg0)
            .await?
            .candid_tuple()?;
        Ok(res)
    }
}
