use backend_api::{ApiError, TransferTokenRequest};
use candid::{Nat, Principal};
use external_canisters::ledger::LedgerCanisterService;
use ic_stable_structures::Storable;
use icrc_ledger_types::icrc1::{account::Account, transfer::TransferArg};

use crate::repositories::{UserProfileRepository, UserProfileRepositoryImpl};

#[cfg_attr(test, mockall::automock)]
pub trait WalletService {
    async fn transfer_token(
        &self,
        calling_principal: Principal,
        request: TransferTokenRequest,
    ) -> Result<Nat, ApiError>;
}

pub struct WalletServiceImpl<U: UserProfileRepository> {
    user_profile_repository: U,
}

impl Default for WalletServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<U: UserProfileRepository> WalletService for WalletServiceImpl<U> {
    async fn transfer_token(
        &self,
        calling_principal: Principal,
        request: TransferTokenRequest,
    ) -> Result<Nat, ApiError> {
        let (user_id, _) = self
            .user_profile_repository
            .get_user_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let ledger_canister = LedgerCanisterService(request.ledger_canister_id);

        match ledger_canister
            .icrc1_transfer(TransferArg {
                amount: request.amount,
                to: Account {
                    owner: request.to,
                    subaccount: None,
                },
                created_at_time: Some(ic_cdk::api::time()),
                from_subaccount: None,
                fee: None,
                memo: Some(user_id.to_bytes().to_vec().into()),
            })
            .await
        {
            Ok(Ok(block_index)) => Ok(block_index),
            Ok(Err(e)) => Err(ApiError::internal(&format!("Transfer failed: {e}"))),
            Err(e) => Err(ApiError::internal(&format!(
                "Call to ledger canister failed: {:?}",
                e
            ))),
        }
    }
}

impl<U: UserProfileRepository> WalletServiceImpl<U> {
    pub fn new(user_profile_repository: U) -> Self {
        Self {
            user_profile_repository,
        }
    }
}
