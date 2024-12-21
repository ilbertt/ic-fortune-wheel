use backend_api::{ApiError, ApiResult, ListWheelAssetsRequest, ListWheelAssetsResponse};
use backend_macros::log_errors;
use candid::Principal;
use ic_cdk::{caller, query};

use crate::{
    repositories::{UserProfileRepositoryImpl, WheelAssetRepositoryImpl, WheelAssetState},
    services::{
        AccessControlService, AccessControlServiceImpl, WheelAssetService, WheelAssetServiceImpl,
    },
};

#[query]
#[log_errors]
fn list_wheel_assets(request: ListWheelAssetsRequest) -> ApiResult<ListWheelAssetsResponse> {
    let calling_principal = caller();

    WheelAssetController::default()
        .list_wheel_assets(calling_principal, request)
        .into()
}

struct WheelAssetController<A: AccessControlService, W: WheelAssetService> {
    access_control_service: A,
    wheel_asset_service: W,
}

impl Default
    for WheelAssetController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        WheelAssetServiceImpl<WheelAssetRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self {
            access_control_service: AccessControlServiceImpl::default(),
            wheel_asset_service: WheelAssetServiceImpl::default(),
        }
    }
}

impl<A: AccessControlService, W: WheelAssetService> WheelAssetController<A, W> {
    fn list_wheel_assets(
        &self,
        calling_principal: Principal,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError> {
        // anonymous or unassigned users can only see enabled assets
        let check_access = match request.state.clone() {
            Some(state) => Into::<WheelAssetState>::into(state) == WheelAssetState::Disabled,
            None => true,
        };

        if check_access {
            self.access_control_service
                .assert_principal_not_anonymous(&calling_principal)?;

            self.access_control_service
                .assert_principal_is_user_or_admin(&calling_principal)?;
        }

        self.wheel_asset_service.list_wheel_assets(request)
    }
}
