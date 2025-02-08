use backend_api::{
    ApiError, GetLastWheelPrizeExtractionResponse, GetWheelPrizeExtractionRequest,
    GetWheelPrizeExtractionResponse,
};

use crate::{
    mappings::map_wheel_prize_extraction,
    repositories::{
        WheelAssetRepository, WheelAssetRepositoryImpl, WheelPrizeExtractionId,
        WheelPrizeExtractionRepository, WheelPrizeExtractionRepositoryImpl,
        WheelPrizeExtractionState,
    },
};

#[cfg_attr(test, mockall::automock)]
pub trait WheelPrizeExtractionService {
    fn get_wheel_prize_extraction(
        &self,
        request: GetWheelPrizeExtractionRequest,
    ) -> Result<GetWheelPrizeExtractionResponse, ApiError>;

    fn get_last_wheel_prize_extraction(
        &self,
    ) -> Result<GetLastWheelPrizeExtractionResponse, ApiError>;
}

pub struct WheelPrizeExtractionServiceImpl<
    A: WheelAssetRepository,
    P: WheelPrizeExtractionRepository,
> {
    wheel_asset_repository: A,
    wheel_prize_extraction_repository: P,
}

impl Default
    for WheelPrizeExtractionServiceImpl<
        WheelAssetRepositoryImpl,
        WheelPrizeExtractionRepositoryImpl,
    >
{
    fn default() -> Self {
        Self::new(
            WheelAssetRepositoryImpl::default(),
            WheelPrizeExtractionRepositoryImpl::default(),
        )
    }
}

impl<A: WheelAssetRepository, P: WheelPrizeExtractionRepository> WheelPrizeExtractionService
    for WheelPrizeExtractionServiceImpl<A, P>
{
    fn get_wheel_prize_extraction(
        &self,
        request: GetWheelPrizeExtractionRequest,
    ) -> Result<GetWheelPrizeExtractionResponse, ApiError> {
        let id = WheelPrizeExtractionId::try_from(request.wheel_prize_extraction_id.as_str())?;
        let wheel_prize_extraction = self
            .wheel_prize_extraction_repository
            .get_wheel_prize_extraction(&id)
            .ok_or_else(|| {
                ApiError::not_found(&format!("Wheel prize extraction with id {} not found", id))
            })?;

        Ok(map_wheel_prize_extraction(id, wheel_prize_extraction))
    }

    fn get_last_wheel_prize_extraction(
        &self,
    ) -> Result<GetLastWheelPrizeExtractionResponse, ApiError> {
        let state = WheelPrizeExtractionState::Extracted;
        let last_extraction = self
            .wheel_prize_extraction_repository
            .get_last_wheel_prize_extraction(Some(&state))
            .map(|(id, wheel_prize_extraction)| {
                map_wheel_prize_extraction(id, wheel_prize_extraction)
            });
        Ok(last_extraction)
    }
}

impl<A: WheelAssetRepository, P: WheelPrizeExtractionRepository>
    WheelPrizeExtractionServiceImpl<A, P>
{
    fn new(wheel_asset_repository: A, wheel_prize_extraction_repository: P) -> Self {
        Self {
            wheel_asset_repository,
            wheel_prize_extraction_repository,
        }
    }
}
