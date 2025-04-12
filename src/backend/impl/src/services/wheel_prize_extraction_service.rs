use std::time::Duration;

use backend_api::{
    ApiError, CreateWheelPrizeExtractionRequest, GetLastWheelPrizeExtractionResponse,
    GetWheelPrizeExtractionRequest, GetWheelPrizeExtractionResponse,
    GetWheelPrizeExtractionsStatsResponse, ListWheelPrizeExtractionsResponse, TransferTokenRequest,
};
use candid::Principal;
use ic_cdk::println;
use rand::{distributions::Uniform, prelude::*};
use system_api::chacha20_rng;
use types::elapsed_since;

use crate::{
    mappings::map_wheel_prize_extraction,
    repositories::{
        HttpAssetRepositoryImpl, UserProfileRepository, UserProfileRepositoryImpl, WheelAssetId,
        WheelAssetRepository, WheelAssetRepositoryImpl, WheelAssetState, WheelAssetType,
        WheelPrizeExtraction, WheelPrizeExtractionId, WheelPrizeExtractionRepository,
        WheelPrizeExtractionRepositoryImpl, WheelPrizeExtractionState,
    },
    services::{WalletService, WalletServiceImpl, WheelAssetService, WheelAssetServiceImpl},
};

/// The minimum time duration to wait before enabling a new extraction for the same principal,
/// if the previous extraction failed.
const MINIMUM_FAILED_WHEEL_PRIZE_EXTRACTION_AGE_DURATION: Duration = Duration::from_secs(30);

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

    fn get_wheel_prize_extractions_stats(
        &self,
    ) -> Result<GetWheelPrizeExtractionsStatsResponse, ApiError>;
}

pub struct WheelPrizeExtractionServiceImpl<
    A: WheelAssetRepository,
    P: WheelPrizeExtractionRepository,
    U: UserProfileRepository,
    W: WalletService,
    WA: WheelAssetService,
> {
    wheel_asset_repository: A,
    wheel_prize_extraction_repository: P,
    user_profile_repository: U,
    wallet_service: W,
    wheel_asset_service: WA,
}

impl Default
    for WheelPrizeExtractionServiceImpl<
        WheelAssetRepositoryImpl,
        WheelPrizeExtractionRepositoryImpl,
        UserProfileRepositoryImpl,
        WalletServiceImpl<UserProfileRepositoryImpl>,
        WheelAssetServiceImpl<WheelAssetRepositoryImpl, HttpAssetRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            WheelAssetRepositoryImpl::default(),
            WheelPrizeExtractionRepositoryImpl::default(),
            UserProfileRepositoryImpl::default(),
            WalletServiceImpl::default(),
            WheelAssetServiceImpl::default(),
        )
    }
}

impl<
        A: WheelAssetRepository,
        P: WheelPrizeExtractionRepository,
        U: UserProfileRepository,
        W: WalletService,
        WA: WheelAssetService,
    > WheelPrizeExtractionService for WheelPrizeExtractionServiceImpl<A, P, U, W, WA>
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
        let state = WheelPrizeExtractionState::default_completed();
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

        let extracted_for_principal = request.extract_for_principal;

        if let Some((_, existing_wheel_prize_extraction)) = self
            .wheel_prize_extraction_repository
            .get_wheel_prize_extraction_by_principal(&extracted_for_principal)
        {
            if !existing_wheel_prize_extraction.is_failed() {
                return Err(ApiError::invalid_argument(
                    "This principal has already been extracted",
                ));
            } else if elapsed_since(&existing_wheel_prize_extraction.timestamps.created_at)
                < MINIMUM_FAILED_WHEEL_PRIZE_EXTRACTION_AGE_DURATION
            {
                return Err(ApiError::invalid_argument(&format!(
                    "You must wait {} seconds before extracting this principal again",
                    MINIMUM_FAILED_WHEEL_PRIZE_EXTRACTION_AGE_DURATION.as_secs(),
                )));
            }
        }

        let extracted_by_user_id = self
            .user_profile_repository
            .get_user_by_principal(calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile for principal {} not found",
                    calling_principal.to_text()
                ))
            })?
            .0;

        let mut wheel_prize_extraction =
            WheelPrizeExtraction::new_processing(extracted_for_principal, extracted_by_user_id);
        let wheel_prize_extraction_id = self
            .wheel_prize_extraction_repository
            .create_wheel_prize_extraction(wheel_prize_extraction.clone())?;

        println!(
            "Wheel prize extraction (id:{}): processing for principal {}",
            wheel_prize_extraction_id, extracted_for_principal
        );

        let (extracted_wheel_asset_id, mut extracted_wheel_asset) = self
            .with_set_failed_on_error(
                wheel_prize_extraction_id,
                &mut wheel_prize_extraction,
                None,
                || async {
                    let available_wheel_assets_ids = self
                        .wheel_asset_repository
                        .list_wheel_assets_by_state(WheelAssetState::Enabled)?
                        .into_iter()
                        .filter(|(_, wheel_asset)| wheel_asset.available_quantity() > 0)
                        .collect::<Vec<_>>();

                    let available_wheel_assets_count = available_wheel_assets_ids.len();
                    if available_wheel_assets_count == 0 {
                        return Err(ApiError::conflict(
                            "No wheel assets available for extraction",
                        ));
                    }

                    let random_index = random_index(available_wheel_assets_count).await?;

                    available_wheel_assets_ids
                        .get(random_index)
                        .cloned()
                        .ok_or_else(|| {
                            ApiError::internal(&format!(
                                "Wheel asset at index {} not found in available wheel assets list",
                                random_index,
                            ))
                        })
                },
            )
            .await?;

        let extracted_wheel_prize_usd_amount = self
            .with_set_failed_on_error(
                wheel_prize_extraction_id,
                &mut wheel_prize_extraction,
                Some(extracted_wheel_asset_id),
                || async {
                    let extracted_usd_amount = match &extracted_wheel_asset.asset_type {
                        WheelAssetType::Token { ledger_config, .. } => {
                            println!(
                                "Wheel prize extraction (id:{}): Transferring token prize",
                                wheel_prize_extraction_id,
                            );

                            self.wallet_service
                                .transfer_token(
                                    *calling_principal,
                                    TransferTokenRequest {
                                        ledger_canister_id: ledger_config.ledger_canister_id,
                                        to: extracted_for_principal,
                                        amount: extracted_wheel_asset
                                            .asset_type
                                            .token_prize_amount()
                                            .unwrap_or(0)
                                            .into(),
                                    },
                                )
                                .await?;
                            self.wheel_asset_service.schedule_token_data_fetchers(
                                extracted_wheel_asset_id,
                                extracted_wheel_asset.asset_type.clone(),
                            );

                            println!(
                                "Wheel prize extraction (id:{}): Completed token transfer",
                                wheel_prize_extraction_id,
                            );

                            extracted_wheel_asset.asset_type.token_prize_usd_amount()
                        }
                        WheelAssetType::Jackpot {
                            wheel_asset_ids: jackpot_wheel_asset_ids,
                        } => {
                            println!(
                                "Wheel prize extraction (id:{}): Transferring jackpot prize",
                                wheel_prize_extraction_id,
                            );

                            let mut jackpot_usd_amount = 0.0;

                            for jackpot_wheel_asset_id in jackpot_wheel_asset_ids {
                                let jackpot_wheel_asset = self
                                    .wheel_asset_repository
                                    .get_wheel_asset(jackpot_wheel_asset_id)
                                    .ok_or_else(|| {
                                        ApiError::not_found(&format!(
                                            "Wheel asset with id {} not found",
                                            jackpot_wheel_asset_id
                                        ))
                                    })?;

                                if let WheelAssetType::Token { ledger_config, .. } =
                                    &jackpot_wheel_asset.asset_type
                                {
                                    self.wallet_service
                                        .transfer_token(
                                            *calling_principal,
                                            TransferTokenRequest {
                                                ledger_canister_id: ledger_config
                                                    .ledger_canister_id,
                                                to: extracted_for_principal,
                                                amount: jackpot_wheel_asset
                                                    .asset_type
                                                    .token_prize_amount()
                                                    .unwrap_or(0)
                                                    .into(),
                                            },
                                        )
                                        .await?;

                                    jackpot_usd_amount += jackpot_wheel_asset
                                        .asset_type
                                        .token_prize_usd_amount()
                                        .unwrap_or(0.0);
                                } else {
                                    // should never happen
                                    return Err(ApiError::internal(&format!(
                                        "Jackpot wheel asset with id {} is not a token",
                                        jackpot_wheel_asset_id
                                    )));
                                }

                                self.wheel_asset_service.schedule_token_data_fetchers(
                                    *jackpot_wheel_asset_id,
                                    jackpot_wheel_asset.asset_type.clone(),
                                );
                            }

                            println!(
                                "Wheel prize extraction (id:{}): Completed jackpot transfer",
                                wheel_prize_extraction_id,
                            );

                            Some(jackpot_usd_amount)
                        }
                        WheelAssetType::Gadget { .. } => None,
                    };

                    extracted_wheel_asset.use_one()?;

                    self.wheel_asset_repository.update_wheel_asset(
                        extracted_wheel_asset_id,
                        extracted_wheel_asset.clone(),
                    )?;

                    Ok(extracted_usd_amount)
                },
            )
            .await?;

        wheel_prize_extraction
            .set_completed(extracted_wheel_asset_id, extracted_wheel_prize_usd_amount);

        println!(
            "Wheel prize extraction (id:{}, state:{}): wheel asset id {:?}",
            wheel_prize_extraction_id,
            wheel_prize_extraction.state,
            wheel_prize_extraction.wheel_asset_id
        );

        self.wheel_prize_extraction_repository
            .update_wheel_prize_extraction(wheel_prize_extraction_id, wheel_prize_extraction)?;

        Ok(())
    }

    fn get_wheel_prize_extractions_stats(
        &self,
    ) -> Result<GetWheelPrizeExtractionsStatsResponse, ApiError> {
        let completed_state = WheelPrizeExtractionState::default_completed();
        let completed_extractions = self
            .wheel_prize_extraction_repository
            .list_wheel_prize_extractions_by_state(&completed_state);

        let total_completed_extractions = completed_extractions.len() as u32;
        let total_spent_usd = completed_extractions
            .into_iter()
            .filter_map(|(_, extraction)| {
                if let WheelPrizeExtractionState::Completed {
                    prize_usd_amount, ..
                } = extraction.state
                {
                    prize_usd_amount
                } else {
                    None
                }
            })
            .sum::<f64>()
            // summing no values returns -0 for some reasons
            .abs();

        Ok(GetWheelPrizeExtractionsStatsResponse {
            total_completed_extractions,
            total_spent_usd,
        })
    }
}

impl<
        A: WheelAssetRepository,
        P: WheelPrizeExtractionRepository,
        U: UserProfileRepository,
        W: WalletService,
        WA: WheelAssetService,
    > WheelPrizeExtractionServiceImpl<A, P, U, W, WA>
{
    fn new(
        wheel_asset_repository: A,
        wheel_prize_extraction_repository: P,
        user_profile_repository: U,
        wallet_service: W,
        wheel_asset_service: WA,
    ) -> Self {
        Self {
            wheel_asset_repository,
            wheel_prize_extraction_repository,
            user_profile_repository,
            wallet_service,
            wheel_asset_service,
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

    async fn with_set_failed_on_error<F, Fut, T>(
        &self,
        extraction_id: WheelPrizeExtractionId,
        extraction: &mut WheelPrizeExtraction,
        wheel_asset_id: Option<WheelAssetId>,
        f: F,
    ) -> Result<T, ApiError>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<T, ApiError>>,
    {
        match f().await {
            Ok(result) => Ok(result),
            Err(error) => {
                extraction.set_failed(wheel_asset_id, error.clone());
                println!(
                    "Wheel prize extraction (id:{}): {}",
                    extraction_id, extraction.state
                );
                self.wheel_prize_extraction_repository
                    .update_wheel_prize_extraction(extraction_id, extraction.clone())?;
                Err(error)
            }
        }
    }
}

/// Extracts a random `usize` in the range `[0, max)`.
async fn random_index(max: usize) -> Result<usize, ApiError> {
    let mut rng = chacha20_rng().await?;
    Ok(rng.sample(Uniform::new(0, max)))
}
