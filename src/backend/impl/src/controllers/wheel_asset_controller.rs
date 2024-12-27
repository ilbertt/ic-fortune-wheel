use backend_api::{
    ApiError, ApiResult, DeleteWheelAssetRequest, ListWheelAssetsRequest, ListWheelAssetsResponse,
    UpdateWheelAssetImageRequest, UpdateWheelAssetRequest,
};
use backend_macros::log_errors;
use candid::Principal;
use ic_cdk::{caller, query, update};

use crate::{
    repositories::{
        HttpAssetRepositoryImpl, UserProfileRepositoryImpl, WheelAssetRepositoryImpl,
        WheelAssetState,
    },
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

#[update]
#[log_errors]
async fn set_default_wheel_assets() -> ApiResult<()> {
    let calling_principal = caller();

    WheelAssetController::default()
        .set_default_wheel_assets(calling_principal)
        .await
        .into()
}

#[update]
#[log_errors]
fn fetch_tokens_data() -> ApiResult<()> {
    let calling_principal = caller();

    WheelAssetController::default()
        .fetch_tokens_data(calling_principal)
        .into()
}

#[update]
#[log_errors]
fn update_wheel_asset(request: UpdateWheelAssetRequest) -> ApiResult<()> {
    let calling_principal = caller();

    WheelAssetController::default()
        .update_wheel_asset(calling_principal, request)
        .into()
}

#[update]
#[log_errors]
fn delete_wheel_asset(request: DeleteWheelAssetRequest) -> ApiResult<()> {
    let calling_principal = caller();

    WheelAssetController::default()
        .delete_wheel_asset(calling_principal, request)
        .into()
}

#[update]
#[log_errors]
async fn update_wheel_asset_image(request: UpdateWheelAssetImageRequest) -> ApiResult<()> {
    let calling_principal = caller();

    WheelAssetController::default()
        .update_wheel_asset_image(calling_principal, request)
        .await
        .into()
}

pub struct WheelAssetController<A: AccessControlService, W: WheelAssetService> {
    access_control_service: A,
    wheel_asset_service: W,
}

impl Default
    for WheelAssetController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        WheelAssetServiceImpl<WheelAssetRepositoryImpl, HttpAssetRepositoryImpl>,
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

    async fn set_default_wheel_assets(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.wheel_asset_service.set_default_wheel_assets().await
    }

    fn fetch_tokens_data(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.wheel_asset_service.fetch_tokens_data()
    }

    pub fn fetch_tokens_data_job(&self) -> Result<(), ApiError> {
        self.wheel_asset_service.fetch_tokens_data()
    }

    fn update_wheel_asset(
        &self,
        calling_principal: Principal,
        request: UpdateWheelAssetRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.wheel_asset_service.update_wheel_asset(request)
    }

    fn delete_wheel_asset(
        &self,
        calling_principal: Principal,
        request: DeleteWheelAssetRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.wheel_asset_service.delete_wheel_asset(request)
    }

    async fn update_wheel_asset_image(
        &self,
        calling_principal: Principal,
        request: UpdateWheelAssetImageRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.wheel_asset_service
            .update_wheel_asset_image(request)
            .await
    }
}
