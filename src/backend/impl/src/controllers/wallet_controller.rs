use backend_api::{ApiError, ApiResult, TransferTokenRequest, TransferTokenResponse};
use backend_macros::log_errors;
use candid::{Nat, Principal};
use ic_cdk::{caller, update};

use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{AccessControlService, AccessControlServiceImpl, WalletService, WalletServiceImpl},
};

#[update]
#[log_errors]
async fn transfer_token(request: TransferTokenRequest) -> ApiResult<TransferTokenResponse> {
    let calling_principal = caller();

    WalletController::default()
        .transfer_token(calling_principal, request)
        .await
        .into()
}

struct WalletController<A: AccessControlService, W: WalletService> {
    access_control_service: A,
    wallet_service: W,
}

impl Default
    for WalletController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        WalletServiceImpl<UserProfileRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self {
            access_control_service: AccessControlServiceImpl::default(),
            wallet_service: WalletServiceImpl::default(),
        }
    }
}

impl<A: AccessControlService, W: WalletService> WalletController<A, W> {
    async fn transfer_token(
        &self,
        calling_principal: Principal,
        request: TransferTokenRequest,
    ) -> Result<Nat, ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.wallet_service
            .transfer_token(calling_principal, request)
            .await
    }
}
