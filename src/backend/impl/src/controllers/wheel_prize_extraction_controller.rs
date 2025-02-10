use backend_api::{
    ApiError, ApiResult, CreateWheelPrizeExtractionRequest, GetLastWheelPrizeExtractionResponse,
    GetWheelPrizeExtractionRequest, GetWheelPrizeExtractionResponse,
    ListWheelPrizeExtractionsResponse,
};
use backend_macros::log_errors;
use candid::Principal;
use ic_cdk::{caller, query, update};

use crate::{
    repositories::{
        UserProfileRepositoryImpl, WheelAssetRepositoryImpl, WheelPrizeExtractionRepositoryImpl,
    },
    services::{
        AccessControlService, AccessControlServiceImpl, WheelPrizeExtractionService,
        WheelPrizeExtractionServiceImpl,
    },
};

#[query]
#[log_errors]
fn get_wheel_prize_extraction(
    request: GetWheelPrizeExtractionRequest,
) -> ApiResult<GetWheelPrizeExtractionResponse> {
    let calling_principal = caller();

    WheelPrizeExtractionController::default()
        .get_wheel_prize_extraction(&calling_principal, request)
        .into()
}

#[query]
#[log_errors]
fn get_last_wheel_prize_extraction() -> ApiResult<GetLastWheelPrizeExtractionResponse> {
    // anyone can call this endpoint
    WheelPrizeExtractionController::default()
        .get_last_wheel_prize_extraction()
        .into()
}

#[query]
#[log_errors]
fn list_wheel_prize_extractions() -> ApiResult<ListWheelPrizeExtractionsResponse> {
    let calling_principal = caller();

    WheelPrizeExtractionController::default()
        .list_wheel_prize_extractions(&calling_principal)
        .into()
}

#[update]
#[log_errors]
async fn create_wheel_prize_extraction(
    request: CreateWheelPrizeExtractionRequest,
) -> ApiResult<()> {
    let calling_principal = caller();

    WheelPrizeExtractionController::default()
        .create_wheel_prize_extraction(&calling_principal, request)
        .await
        .into()
}

pub struct WheelPrizeExtractionController<A: AccessControlService, W: WheelPrizeExtractionService> {
    access_control_service: A,
    wheel_prize_extraction_service: W,
}

impl Default
    for WheelPrizeExtractionController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        WheelPrizeExtractionServiceImpl<
            WheelAssetRepositoryImpl,
            WheelPrizeExtractionRepositoryImpl,
            UserProfileRepositoryImpl,
        >,
    >
{
    fn default() -> Self {
        Self {
            access_control_service: AccessControlServiceImpl::default(),
            wheel_prize_extraction_service: WheelPrizeExtractionServiceImpl::default(),
        }
    }
}

impl<A: AccessControlService, W: WheelPrizeExtractionService> WheelPrizeExtractionController<A, W> {
    fn get_wheel_prize_extraction(
        &self,
        calling_principal: &Principal,
        request: GetWheelPrizeExtractionRequest,
    ) -> Result<GetWheelPrizeExtractionResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_admin_or_scanner(calling_principal)?;

        self.wheel_prize_extraction_service
            .get_wheel_prize_extraction(request)
    }

    fn get_last_wheel_prize_extraction(
        &self,
    ) -> Result<GetLastWheelPrizeExtractionResponse, ApiError> {
        self.wheel_prize_extraction_service
            .get_last_wheel_prize_extraction()
    }

    fn list_wheel_prize_extractions(
        &self,
        calling_principal: &Principal,
    ) -> Result<ListWheelPrizeExtractionsResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_admin_or_scanner(calling_principal)?;

        self.wheel_prize_extraction_service
            .list_wheel_prize_extractions()
    }

    async fn create_wheel_prize_extraction(
        &self,
        calling_principal: &Principal,
        request: CreateWheelPrizeExtractionRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin_or_scanner(calling_principal)?;

        self.wheel_prize_extraction_service
            .create_wheel_prize_extraction(calling_principal, request)
            .await
    }
}
