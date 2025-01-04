use std::{path::Path, time::Duration};

use backend_api::{
    ApiError, CreateWheelAssetRequest, CreateWheelAssetResponse, DeleteWheelAssetRequest,
    ListWheelAssetsRequest, ListWheelAssetsResponse, UpdateWheelAssetImageConfig,
    UpdateWheelAssetImageRequest, UpdateWheelAssetRequest, UpdateWheelAssetTypeConfig,
    WheelAssetImageConfig,
};
use external_canisters::{ledger::LedgerCanisterService, xrc::ExchangeRateCanisterService};
use ic_cdk::{println, spawn};
use ic_cdk_timers::set_timer;
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest};
use icrc_ledger_types::icrc1::account::Account;

use crate::{
    mappings::map_wheel_asset,
    repositories::{
        ckbtc_wheel_asset, cketh_wheel_asset, ckusdc_wheel_asset, icp_wheel_asset, HttpAsset,
        HttpAssetRepository, HttpAssetRepositoryImpl, WheelAsset, WheelAssetId,
        WheelAssetRepository, WheelAssetRepositoryImpl, WheelAssetTokenBalance,
        WheelAssetTokenPrice, WheelAssetType,
    },
};

const WHEEL_ASSET_NAME_MAX_LENGTH: usize = 100;
const WHEEL_ASSET_IMAGES_HTTP_PATH: &str = "/images/wheel";
const WHEEL_ASSET_IMAGES_ALLOWED_CONTENT_TYPES: [&str; 2] = ["image/png", "image/svg+xml"];

#[cfg_attr(test, mockall::automock)]
pub trait WheelAssetService {
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError>;

    async fn set_default_wheel_assets(&self) -> Result<(), ApiError>;

    fn fetch_tokens_data(&self) -> Result<(), ApiError>;

    async fn create_wheel_asset(
        &self,
        asset: CreateWheelAssetRequest,
    ) -> Result<CreateWheelAssetResponse, ApiError>;

    fn update_wheel_asset(&self, request: UpdateWheelAssetRequest) -> Result<(), ApiError>;

    fn delete_wheel_asset(&self, request: DeleteWheelAssetRequest) -> Result<(), ApiError>;

    async fn update_wheel_asset_image(
        &self,
        request: UpdateWheelAssetImageRequest,
    ) -> Result<(), ApiError>;
}

pub struct WheelAssetServiceImpl<W: WheelAssetRepository, H: HttpAssetRepository> {
    wheel_asset_repository: W,
    http_asset_repository: H,
}

impl Default for WheelAssetServiceImpl<WheelAssetRepositoryImpl, HttpAssetRepositoryImpl> {
    fn default() -> Self {
        Self::new(
            WheelAssetRepositoryImpl::default(),
            HttpAssetRepositoryImpl::default(),
        )
    }
}

impl<W: WheelAssetRepository, H: HttpAssetRepository> WheelAssetService
    for WheelAssetServiceImpl<W, H>
{
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError> {
        let state = request.state.map(Into::into);

        let items = match state {
            Some(state) => self
                .wheel_asset_repository
                .list_wheel_assets_by_state(state)?,
            None => self.wheel_asset_repository.list_wheel_assets(),
        }
        .into_iter()
        .map(|(id, asset)| map_wheel_asset(id, asset))
        .collect();

        Ok(items)
    }

    async fn set_default_wheel_assets(&self) -> Result<(), ApiError> {
        let existing_assets_count = self.wheel_asset_repository.list_wheel_assets().len();

        if existing_assets_count > 0 {
            return Err(ApiError::conflict("Wheel assets already exist"));
        }

        for (asset, wheel_image_content_bytes) in [
            icp_wheel_asset(),
            ckbtc_wheel_asset(),
            cketh_wheel_asset(),
            ckusdc_wheel_asset(),
        ] {
            let asset_id = self
                .wheel_asset_repository
                .create_wheel_asset(asset.clone())
                .await?;

            // Not so nice done in this way, but it's quicker
            self.update_wheel_asset_image(UpdateWheelAssetImageRequest {
                id: asset_id.to_string(),
                image_config: UpdateWheelAssetImageConfig::Wheel(WheelAssetImageConfig {
                    content_bytes: wheel_image_content_bytes,
                    content_type: "image/png".to_string(),
                }),
            })
            .await?;

            self.schedule_balance_fetcher(asset_id, asset.asset_type.clone());
            self.schedule_price_fetcher(asset_id, asset.asset_type);
        }

        Ok(())
    }

    fn fetch_tokens_data(&self) -> Result<(), ApiError> {
        let token_assets = self
            .wheel_asset_repository
            .list_wheel_assets_by_type(&WheelAssetType::empty_token())?;

        let token_assets_count = token_assets.len();

        for (asset_id, asset) in token_assets {
            self.schedule_balance_fetcher(asset_id, asset.asset_type.clone());
            self.schedule_price_fetcher(asset_id, asset.asset_type);
        }

        println!(
            "fetch_tokens_data: Scheduled price and balance fetchers for {} token assets",
            token_assets_count
        );

        Ok(())
    }

    async fn create_wheel_asset(
        &self,
        request: CreateWheelAssetRequest,
    ) -> Result<CreateWheelAssetResponse, ApiError> {
        self.validate_create_wheel_asset_request(&request)?;

        let wheel_asset = WheelAsset::new_enabled(
            request.name,
            request.asset_type_config.into(),
            request.total_amount,
        );

        let id = self
            .wheel_asset_repository
            .create_wheel_asset(wheel_asset.clone())
            .await?;

        Ok(map_wheel_asset(id, wheel_asset))
    }

    fn update_wheel_asset(&self, request: UpdateWheelAssetRequest) -> Result<(), ApiError> {
        self.validate_update_wheel_asset_request(&request)?;

        let asset_id = WheelAssetId::try_from(request.id.as_str())?;
        let mut existing_asset = self.get_wheel_asset(&asset_id)?;

        if let Some(name) = request.name {
            existing_asset.name = name;
        }

        if let Some(total_amount) = request.total_amount {
            existing_asset.total_amount = total_amount;
        }

        if let Some(used_amount) = request.used_amount {
            existing_asset.used_amount = used_amount;
        }

        self.validate_wheel_asset_amounts(existing_asset.total_amount, existing_asset.used_amount)?;

        if let Some(state) = request.state {
            existing_asset.state = state.into();
        }

        if let Some(asset_type_config) = request.asset_type_config {
            match (asset_type_config, &mut existing_asset.asset_type) {
                (
                    UpdateWheelAssetTypeConfig::Token {
                        prize_usd_amount: new_prize_usd_amount,
                    },
                    WheelAssetType::Token {
                        prize_usd_amount: existing_prize_usd_amount,
                        ..
                    },
                ) => {
                    if let Some(new_prize_usd_amount) = new_prize_usd_amount {
                        *existing_prize_usd_amount = new_prize_usd_amount;
                    }
                }
                (
                    UpdateWheelAssetTypeConfig::Gadget {
                        article_type: new_article_type,
                    },
                    WheelAssetType::Gadget {
                        article_type: existing_article_type,
                    },
                ) => {
                    *existing_article_type = new_article_type;
                }
                (UpdateWheelAssetTypeConfig::Jackpot, WheelAssetType::Jackpot) => {}
                _ => {
                    return Err(ApiError::invalid_argument(
                        "Asset type config does not match existing asset type",
                    ))
                }
            }
        }

        self.wheel_asset_repository
            .update_wheel_asset(asset_id, existing_asset)
    }

    fn delete_wheel_asset(&self, request: DeleteWheelAssetRequest) -> Result<(), ApiError> {
        let asset_id = WheelAssetId::try_from(request.id.as_str())?;

        let existing_asset = self.get_wheel_asset(&asset_id)?;

        if existing_asset.is_token() {
            // TODO: implement token deletion once we know what to do with the remaining balance
            return Err(ApiError::invalid_argument("Cannot delete token asset"));
        }

        if let Some(path) = &existing_asset.modal_image_path {
            self.http_asset_repository.delete_http_asset(path)?;
        }
        if let Some(path) = &existing_asset.wheel_image_path {
            self.http_asset_repository.delete_http_asset(path)?;
        }
        self.http_asset_repository.certify_all_assets()?;

        self.wheel_asset_repository.delete_wheel_asset(&asset_id)
    }

    async fn update_wheel_asset_image(
        &self,
        request: UpdateWheelAssetImageRequest,
    ) -> Result<(), ApiError> {
        self.validate_wheel_asset_image_request(&request)?;

        let asset_id = WheelAssetId::try_from(request.id.as_str())?;

        let mut existing_asset = self.get_wheel_asset(&asset_id)?;

        let (content_type, content_bytes) = match request.image_config.clone() {
            UpdateWheelAssetImageConfig::Modal(config) => {
                (config.content_type, config.content_bytes)
            }
            UpdateWheelAssetImageConfig::Wheel(config) => {
                (config.content_type, config.content_bytes)
            }
        };
        let (http_asset_path, http_asset) = HttpAsset::new_at_path(
            Path::new(WHEEL_ASSET_IMAGES_HTTP_PATH),
            content_type,
            content_bytes,
        )
        .await?;
        self.http_asset_repository
            .create_http_asset(http_asset_path.clone(), http_asset)?;

        let existing_asset_path = match request.image_config {
            UpdateWheelAssetImageConfig::Modal(_) => {
                existing_asset.modal_image_path.replace(http_asset_path)
            }
            UpdateWheelAssetImageConfig::Wheel(_) => {
                existing_asset.wheel_image_path.replace(http_asset_path)
            }
        };
        if let Some(path) = existing_asset_path {
            self.http_asset_repository.delete_http_asset(&path)?;
        }
        self.http_asset_repository.certify_all_assets()?;

        self.wheel_asset_repository
            .update_wheel_asset(asset_id, existing_asset)
    }
}

impl<W: WheelAssetRepository, H: HttpAssetRepository> WheelAssetServiceImpl<W, H> {
    fn new(wheel_asset_repository: W, http_asset_repository: H) -> Self {
        Self {
            wheel_asset_repository,
            http_asset_repository,
        }
    }

    fn get_wheel_asset(&self, id: &WheelAssetId) -> Result<WheelAsset, ApiError> {
        self.wheel_asset_repository
            .get_wheel_asset(id)
            .ok_or_else(|| ApiError::not_found(&format!("Wheel asset with id {} not found", id)))
    }

    fn validate_create_wheel_asset_request(
        &self,
        request: &CreateWheelAssetRequest,
    ) -> Result<(), ApiError> {
        if request.name.is_empty() {
            return Err(ApiError::invalid_argument("Name must not be empty"));
        }
        if request.name.chars().count() > WHEEL_ASSET_NAME_MAX_LENGTH {
            return Err(ApiError::invalid_argument(&format!(
                "Name must be at most {WHEEL_ASSET_NAME_MAX_LENGTH} characters"
            )));
        }
        Ok(())
    }

    fn validate_update_wheel_asset_request(
        &self,
        request: &UpdateWheelAssetRequest,
    ) -> Result<(), ApiError> {
        if let Some(name) = &request.name {
            if name.is_empty() {
                return Err(ApiError::invalid_argument("Name must not be empty"));
            }
            if name.chars().count() > WHEEL_ASSET_NAME_MAX_LENGTH {
                return Err(ApiError::invalid_argument(&format!(
                    "Name must be at most {WHEEL_ASSET_NAME_MAX_LENGTH} characters"
                )));
            }
        }

        if let (Some(total_amount), Some(used_amount)) = (request.total_amount, request.used_amount)
        {
            self.validate_wheel_asset_amounts(total_amount, used_amount)?;
        }

        if let Some(asset_type_config) = &request.asset_type_config {
            match asset_type_config {
                UpdateWheelAssetTypeConfig::Token { prize_usd_amount } => {
                    if let Some(prize_usd_amount) = prize_usd_amount {
                        if *prize_usd_amount <= 0.0 {
                            return Err(ApiError::invalid_argument(
                                "Prize USD amount must be greater than 0",
                            ));
                        }
                    }
                }
                UpdateWheelAssetTypeConfig::Gadget { .. } | UpdateWheelAssetTypeConfig::Jackpot => {
                }
            }
        }

        Ok(())
    }

    fn validate_wheel_asset_amounts(
        &self,
        total_amount: u32,
        used_amount: u32,
    ) -> Result<(), ApiError> {
        if total_amount < used_amount {
            return Err(ApiError::invalid_argument(
                "Total amount must be greater or equal to used amount",
            ));
        }

        Ok(())
    }

    fn validate_wheel_asset_image_request(
        &self,
        request: &UpdateWheelAssetImageRequest,
    ) -> Result<(), ApiError> {
        let content_type = match &request.image_config {
            UpdateWheelAssetImageConfig::Modal(config) => &config.content_type,
            UpdateWheelAssetImageConfig::Wheel(config) => &config.content_type,
        };

        if !WHEEL_ASSET_IMAGES_ALLOWED_CONTENT_TYPES.contains(&content_type.as_str()) {
            return Err(ApiError::invalid_argument(&format!(
                "Invalid content type: {}",
                content_type
            )));
        }

        Ok(())
    }

    /// Immediately (= after 0 seconds) starts a task to fetch the price of the given asset,
    /// if the asset has an exchange rate symbol.
    fn schedule_price_fetcher(&self, asset_id: WheelAssetId, asset_type: WheelAssetType) {
        if !asset_type.should_fetch_usd_price() {
            return;
        }

        println!(
            "schedule_price_fetcher: Scheduling price fetcher for asset {}",
            asset_id
        );

        set_timer(Duration::from_secs(0), move || {
            spawn(async move {
                WheelAssetServiceImpl::default()
                    .fetch_and_save_token_price(asset_id, asset_type)
                    .await
            });
        });
    }

    async fn fetch_and_save_token_price(&self, asset_id: WheelAssetId, asset_type: WheelAssetType) {
        println!(
            "fetch_and_save_token_price: Fetching price for asset {}",
            asset_id
        );

        let symbol = match asset_type {
            WheelAssetType::Token {
                exchange_rate_symbol,
                ..
            } => exchange_rate_symbol.expect("asset should have an exchange rate symbol"),
            _ => {
                // should never happen
                println!("fetch_and_save_token_price: invalid asset type");
                return;
            }
        };

        let xrc_canister = ExchangeRateCanisterService::default();

        let request = GetExchangeRateRequest {
            base_asset: Asset {
                symbol: symbol.clone(),
                class: AssetClass::Cryptocurrency,
            },
            quote_asset: Asset {
                symbol: "USD".to_string(),
                class: AssetClass::FiatCurrency,
            },
            timestamp: None, // get the latest rate
        };

        match xrc_canister.get_exchange_rate(request).await {
            Ok(result) => {
                let usd_price = result.rate as f64 / 10_f64.powi(result.metadata.decimals as i32);

                let mut asset = match self.wheel_asset_repository.get_wheel_asset(&asset_id) {
                    Some(asset) => asset,
                    None => {
                        println!(
                            "fetch_and_save_token_price: asset with id {} not found, it may have been deleted",
                            asset_id
                        );
                        return;
                    }
                };

                asset.set_latest_price(WheelAssetTokenPrice::new(usd_price));

                if let Err(err) = self
                    .wheel_asset_repository
                    .update_wheel_asset(asset_id, asset)
                {
                    println!(
                        "Error: fetch_and_save_token_price: failed to update asset with id {}: {}",
                        asset_id, err,
                    );
                    return;
                }

                println!(
                    "fetch_and_save_token_price: Successfully fetched and saved price for asset {}",
                    asset_id
                );
            }
            Err(err) => {
                // TODO: implement retry
                println!(
                    "Error: fetch_and_save_token_price: failed to get exchange rate for asset {}: symbol {}, error: {:?}",
                    asset_id, symbol, err
                )
            }
        }
    }

    /// Immediately (= after 0 seconds) starts a task to fetch the balance of the given token asset.
    fn schedule_balance_fetcher(&self, asset_id: WheelAssetId, asset_type: WheelAssetType) {
        println!(
            "schedule_balance_fetcher: Scheduling balance fetcher for asset {}",
            asset_id
        );

        set_timer(Duration::from_secs(0), move || {
            spawn(async move {
                WheelAssetServiceImpl::default()
                    .fetch_and_save_token_balance(asset_id, asset_type)
                    .await
            });
        });
    }

    async fn fetch_and_save_token_balance(
        &self,
        asset_id: WheelAssetId,
        asset_type: WheelAssetType,
    ) {
        println!(
            "fetch_and_save_token_balance: Fetching balance for asset {}",
            asset_id
        );

        let ledger_canister_id = match asset_type {
            WheelAssetType::Token { ledger_config, .. } => ledger_config.ledger_canister_id,
            _ => {
                // should never happen
                println!("fetch_and_save_token_balance: invalid asset type");
                return;
            }
        };

        let ledger_canister = LedgerCanisterService(ledger_canister_id);

        match ledger_canister
            .icrc1_balance_of(Account {
                owner: ic_cdk::id(),
                subaccount: None,
            })
            .await
        {
            Ok(balance) => {
                let mut asset = match self.wheel_asset_repository.get_wheel_asset(&asset_id) {
                    Some(asset) => asset,
                    None => {
                        println!(
                            "fetch_and_save_token_balance: asset with id {} not found, it may have been deleted",
                            asset_id
                        );
                        return;
                    }
                };

                asset.set_latest_balance(WheelAssetTokenBalance::new(balance));

                if let Err(err) = self
                    .wheel_asset_repository
                    .update_wheel_asset(asset_id, asset)
                {
                    println!(
                        "Error: fetch_and_save_token_balance: failed to update asset with id {}: {}",
                        asset_id, err,
                    );
                    return;
                }

                println!(
                    "fetch_and_save_token_balance: Successfully fetched and saved balance for asset {}",
                    asset_id
                );
            }
            Err(err) => {
                // TODO: implement retry
                println!(
                    "Error: fetch_and_save_token_balance: failed to get balance for asset {}: error: {:?}",
                    asset_id, err
                )
            }
        }
    }
}
