use backend_api::{
    ApiError, CreateWheelPrizeExtractionRequest, GetLastWheelPrizeExtractionResponse,
    GetWheelPrizeExtractionRequest, GetWheelPrizeExtractionResponse,
    ListWheelPrizeExtractionsResponse,
};
use candid::Principal;
use rand::{distributions::Uniform, prelude::*};

use crate::{
    mappings::map_wheel_prize_extraction,
    repositories::{
        TimestampFields, UserProfileRepository, UserProfileRepositoryImpl, WheelAssetRepository,
        WheelAssetRepositoryImpl, WheelAssetState, WheelPrizeExtraction, WheelPrizeExtractionId,
        WheelPrizeExtractionRepository, WheelPrizeExtractionRepositoryImpl,
        WheelPrizeExtractionState,
    },
    system_api::chacha20_rng,
};

#[cfg_attr(test, mockall::automock)]
#[allow(clippy::needless_lifetimes)]
pub trait WheelPrizeExtractionService {
    fn get_wheel_prize_extraction(
        &self,
        request: GetWheelPrizeExtractionRequest,
    ) -> Result<GetWheelPrizeExtractionResponse, ApiError>;

    fn get_last_wheel_prize_extraction(
        &self,
    ) -> Result<GetLastWheelPrizeExtractionResponse, ApiError>;

    fn list_wheel_prize_extractions(&self) -> Result<ListWheelPrizeExtractionsResponse, ApiError>;

    async fn create_wheel_prize_extraction<'a>(
        &self,
        calling_principal: &'a Principal,
        request: CreateWheelPrizeExtractionRequest,
    ) -> Result<(), ApiError>;
}

pub struct WheelPrizeExtractionServiceImpl<
    A: WheelAssetRepository,
    P: WheelPrizeExtractionRepository,
    U: UserProfileRepository,
> {
    wheel_asset_repository: A,
    wheel_prize_extraction_repository: P,
    user_profile_repository: U,
}

impl Default
    for WheelPrizeExtractionServiceImpl<
        WheelAssetRepositoryImpl,
        WheelPrizeExtractionRepositoryImpl,
        UserProfileRepositoryImpl,
    >
{
    fn default() -> Self {
        Self::new(
            WheelAssetRepositoryImpl::default(),
            WheelPrizeExtractionRepositoryImpl::default(),
            UserProfileRepositoryImpl::default(),
        )
    }
}

impl<A: WheelAssetRepository, P: WheelPrizeExtractionRepository, U: UserProfileRepository>
    WheelPrizeExtractionService for WheelPrizeExtractionServiceImpl<A, P, U>
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

    fn list_wheel_prize_extractions(&self) -> Result<ListWheelPrizeExtractionsResponse, ApiError> {
        let wheel_prize_extractions = self
            .wheel_prize_extraction_repository
            .list_wheel_prize_extractions()
            .into_iter()
            .map(|(id, wheel_prize_extraction)| {
                map_wheel_prize_extraction(id, wheel_prize_extraction)
            })
            .collect();
        Ok(wheel_prize_extractions)
    }

    async fn create_wheel_prize_extraction(
        &self,
        calling_principal: &Principal,
        request: CreateWheelPrizeExtractionRequest,
    ) -> Result<(), ApiError> {
        self.validate_create_wheel_prize_extraction_request(&request)?;

        if self
            .wheel_prize_extraction_repository
            .get_wheel_prize_extraction_by_principal(&request.extract_for_principal)
            .is_some()
        {
            return Err(ApiError::invalid_argument(
                "This principal has already been extracted",
            ));
        }

        let extracting_user_id = self
            .user_profile_repository
            .get_user_by_principal(calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile for principal {} not found",
                    calling_principal.to_text()
                ))
            })?
            .0;

        let available_wheel_assets_ids = self
            .wheel_asset_repository
            .list_wheel_assets_by_state(WheelAssetState::Enabled)?
            .into_iter()
            .filter(|(_, wheel_asset)| wheel_asset.available_quantity() > 0)
            .collect::<Vec<_>>();

        let (extracted_wheel_asset_id, mut extracted_wheel_asset) = {
            let random_index = random_index(available_wheel_assets_ids.len()).await?;

            available_wheel_assets_ids
                .get(random_index)
                .cloned()
                // SAFETY: the random index is in the range `[0, len)`, so it is always < `len`
                .unwrap()
        };

        // should never fail, as we have checked that the quantity is > 0
        // before extracting the prize
        extracted_wheel_asset.use_one()?;

        // TODO: transfer tokens

        let wheel_prize_extraction = WheelPrizeExtraction {
            extracted_for_principal: request.extract_for_principal,
            wheel_asset_id: extracted_wheel_asset_id,
            state: WheelPrizeExtractionState::Extracted,
            extracted_by_user_id: extracting_user_id,
            timestamps: TimestampFields::new(),
        };

        self.wheel_prize_extraction_repository
            .create_wheel_prize_extraction(wheel_prize_extraction)
            .await?;

        self.wheel_asset_repository
            .update_wheel_asset(extracted_wheel_asset_id, extracted_wheel_asset)?;

        Ok(())
    }
}

impl<A: WheelAssetRepository, P: WheelPrizeExtractionRepository, U: UserProfileRepository>
    WheelPrizeExtractionServiceImpl<A, P, U>
{
    fn new(
        wheel_asset_repository: A,
        wheel_prize_extraction_repository: P,
        user_profile_repository: U,
    ) -> Self {
        Self {
            wheel_asset_repository,
            wheel_prize_extraction_repository,
            user_profile_repository,
        }
    }

    fn validate_create_wheel_prize_extraction_request(
        &self,
        request: &CreateWheelPrizeExtractionRequest,
    ) -> Result<(), ApiError> {
        if request.extract_for_principal == Principal::anonymous() {
            return Err(ApiError::invalid_argument(
                "Extract for principal cannot be anonymous",
            ));
        }

        if request.extract_for_principal == ic_cdk::id() {
            return Err(ApiError::invalid_argument(
                "Extract for principal cannot be this canister's principal",
            ));
        }

        Ok(())
    }
}

/// Extracts a random `usize` in the range `[0, max)`.
async fn random_index(max: usize) -> Result<usize, ApiError> {
    let mut rng = chacha20_rng().await?;
    Ok(rng.sample(Uniform::new(0, max)))
}
