use backend_api::{ApiError, TransferTokenRequest};
use candid::{Nat, Principal};
use external_canisters::ledger::{Account, LedgerCanisterService, TransferArg};
use ic_cdk::println;
use ic_stable_structures::Storable;

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

        let display_request = request.to_string();
        println!("Transferring token. Request: {}", display_request);

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
            Ok(Ok(block_index)) => {
                println!(
                    "Token transferred successfully. Request: {}, Block index: {}",
                    display_request, block_index
                );
                Ok(block_index)
            }
            Ok(Err(e)) => {
                let error_message = format!("Transfer failed: {e}");
                println!(
                    "Transfer failed. Request: {}, Error: {}",
                    display_request, error_message
                );
                Err(ApiError::internal(&error_message))
            }
            Err(e) => {
                let error_message = format!("Call to ledger canister failed: {:?}", e);
                println!(
                    "Call to ledger canister failed. Request: {}, Error: {}",
                    display_request, error_message
                );
                Err(ApiError::internal(&error_message))
            }
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
