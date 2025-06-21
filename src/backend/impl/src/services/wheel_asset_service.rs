use std::{collections::HashSet, path::Path};

use backend_api::{
    ApiError, CreateWheelAssetRequest, CreateWheelAssetResponse, CreateWheelAssetTypeConfig,
    DeleteWheelAssetRequest, ListWheelAssetsRequest, ListWheelAssetsResponse,
    ListWheelPrizesResponse, UpdateWheelAssetImageConfig, UpdateWheelAssetImageRequest,
    UpdateWheelAssetRequest, UpdateWheelAssetTypeConfig, UpdateWheelPrizesOrderRequest,
    WheelAssetImageConfig, WheelAssetUiSettings,
};
use external_canisters::{ledger::LedgerCanisterService, xrc::ExchangeRateCanisterService};
use ic_cdk::{futures::spawn, println};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest};
use icrc_ledger_types::icrc1::account::Account;
use lazy_static::lazy_static;
use regex::Regex;

use crate::{
    mappings::{into_wheel_asset_ids, map_wheel_asset, map_wheel_prize},
    repositories::{
        ckbtc_wheel_asset, cketh_wheel_asset, ckusdc_wheel_asset, icp_wheel_asset, HttpAsset,
        HttpAssetRepository, HttpAssetRepositoryImpl, WheelAsset, WheelAssetId,
        WheelAssetRepository, WheelAssetRepositoryImpl, WheelAssetState, WheelAssetTokenBalance,
        WheelAssetTokenPrice, WheelAssetType, CACHE_CONTROL_HEADER_NAME, ONE_WEEK_CACHE_CONTROL,
    },
};

const WHEEL_ASSET_NAME_MAX_LENGTH: usize = 100;
const WHEEL_ASSET_IMAGES_HTTP_PATH: &str = "/images/wheel";
const WHEEL_ASSET_IMAGES_ALLOWED_CONTENT_TYPES: [&str; 2] = ["image/png", "image/svg+xml"];
/// The minimum amount (in USD) for a wheel token asset prize
pub const MINIMUM_WHEEL_ASSET_TOKEN_PRIZE_USD_AMOUNT: f64 = 0.5;
/// The maximum amount (in USD) for a wheel token asset prize
pub const MAXIMUM_WHEEL_ASSET_TOKEN_PRIZE_USD_AMOUNT: f64 = 500.0;
lazy_static! {
    static ref WHEEL_ASSET_UI_SETTING_BACKGROUND_COLOR_HEX_REGEX: Regex =
        Regex::new(r"^#(?:[0-9a-fA-F]{3}){1,2}$").unwrap();
}
const MINIMUM_WHEEL_ASSET_JACKPOT_ASSET_IDS_COUNT: usize = 2;
const MAXIMUM_WHEEL_ASSET_JACKPOT_ASSET_IDS_COUNT: usize = 4;

#[cfg_attr(test, mockall::automock)]
pub trait WheelAssetService {
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError>;

    fn set_default_wheel_assets(&self) -> Result<(), ApiError>;

    fn fetch_tokens_data(&self) -> Result<(), ApiError>;

    fn schedule_token_data_fetchers(&self, asset_id: WheelAssetId, asset_type: WheelAssetType);

    fn create_wheel_asset(
        &self,
        asset: CreateWheelAssetRequest,
    ) -> Result<CreateWheelAssetResponse, ApiError>;

    fn update_wheel_asset(&self, request: UpdateWheelAssetRequest) -> Result<(), ApiError>;

    fn delete_wheel_asset(&self, request: DeleteWheelAssetRequest) -> Result<(), ApiError>;

    fn update_wheel_asset_image(
        &self,
        request: UpdateWheelAssetImageRequest,
    ) -> Result<(), ApiError>;

    fn list_wheel_prizes(&self) -> Result<ListWheelPrizesResponse, ApiError>;

    fn update_wheel_prizes_order(
        &self,
        request: UpdateWheelPrizesOrderRequest,
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

    fn set_default_wheel_assets(&self) -> Result<(), ApiError> {
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
                .create_wheel_asset(asset.clone())?;

            // Not so nice done in this way, but it's quicker
            self.update_wheel_asset_image(UpdateWheelAssetImageRequest {
                id: asset_id.to_string(),
                image_config: UpdateWheelAssetImageConfig::Wheel(WheelAssetImageConfig {
                    content_bytes: wheel_image_content_bytes,
                    content_type: "image/png".to_string(),
                }),
            })?;

            self.schedule_token_data_fetchers(asset_id, asset.asset_type.clone());
        }

        Ok(())
    }

    fn fetch_tokens_data(&self) -> Result<(), ApiError> {
        let token_assets = self
            .wheel_asset_repository
            .list_wheel_assets_by_type(&WheelAssetType::empty_token())?;

        let token_assets_count = token_assets.len();

        for (asset_id, asset) in token_assets {
            self.schedule_token_data_fetchers(asset_id, asset.asset_type);
        }

        println!(
            "fetch_tokens_data: Scheduled price and balance fetchers for {} token assets",
            token_assets_count
        );

        Ok(())
    }

    fn schedule_token_data_fetchers(&self, asset_id: WheelAssetId, asset_type: WheelAssetType) {
        self.schedule_balance_fetcher(asset_id, asset_type.clone());
        self.schedule_price_fetcher(asset_id, asset_type);
    }

    fn create_wheel_asset(
        &self,
        request: CreateWheelAssetRequest,
    ) -> Result<CreateWheelAssetResponse, ApiError> {
        self.validate_create_wheel_asset_request(&request)?;

        let wheel_asset_type = request.asset_type_config.try_into()?;

        if let WheelAssetType::Token {
            ref ledger_config, ..
        } = wheel_asset_type
        {
            if self
                .wheel_asset_repository
                .list_wheel_assets_by_type(&wheel_asset_type)?
                .iter()
                .any(|(_, asset)| {
                    asset
                        .asset_type
                        .ledger_config()
                        .map(|config| config.ledger_canister_id == ledger_config.ledger_canister_id)
                        .unwrap_or(false)
                })
            {
                return Err(ApiError::invalid_argument(&format!(
                    "Token asset with ledger canister ID {} already exists",
                    ledger_config.ledger_canister_id
                )));
            }
        }

        let wheel_asset = WheelAsset::new_enabled(
            request.name,
            wheel_asset_type,
            request.total_amount,
            request.wheel_ui_settings.map(Into::into),
        );

        let id = self
            .wheel_asset_repository
            .create_wheel_asset(wheel_asset.clone())?;

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
                        exchange_rate_symbol: new_exchange_rate_symbol,
                        prize_usd_amount: new_prize_usd_amount,
                        ledger_config: new_ledger_config,
                    },
                    WheelAssetType::Token {
                        prize_usd_amount: existing_prize_usd_amount,
                        exchange_rate_symbol: existing_exchange_rate_symbol,
                        ledger_config: existing_ledger_config,
                        ..
                    },
                ) => {
                    if let Some(new_prize_usd_amount) = new_prize_usd_amount {
                        *existing_prize_usd_amount = new_prize_usd_amount;
                    }
                    if let Some(new_exchange_rate_symbol) = new_exchange_rate_symbol {
                        *existing_exchange_rate_symbol = Some(new_exchange_rate_symbol);
                    }
                    if let Some(new_ledger_config) = new_ledger_config {
                        if let Some(new_decimals) = new_ledger_config.decimals {
                            existing_ledger_config.decimals = new_decimals;
                        }
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
                (
                    UpdateWheelAssetTypeConfig::Jackpot {
                        wheel_asset_ids: new_wheel_asset_ids,
                    },
                    WheelAssetType::Jackpot {
                        wheel_asset_ids: existing_wheel_asset_ids,
                    },
                ) => {
                    *existing_wheel_asset_ids = into_wheel_asset_ids(new_wheel_asset_ids)?;
                }
                _ => {
                    return Err(ApiError::invalid_argument(
                        "Asset type config does not match existing asset type",
                    ))
                }
            }
        }

        if let Some(wheel_ui_settings) = request.wheel_ui_settings {
            existing_asset.wheel_ui_settings = wheel_ui_settings.into();
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

    fn update_wheel_asset_image(
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
            vec![(
                CACHE_CONTROL_HEADER_NAME.to_string(),
                ONE_WEEK_CACHE_CONTROL.to_string(),
            )],
            None,
        )?;
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

    fn list_wheel_prizes(&self) -> Result<ListWheelPrizesResponse, ApiError> {
        let prizes = self
            .wheel_asset_repository
            .get_wheel_prizes_order()
            .iter()
            .map(|id| {
                // SAFETY: wheel asset with this id should always exists
                let wheel_asset = self.wheel_asset_repository.get_wheel_asset(id).unwrap();
                map_wheel_prize(*id, wheel_asset)
            })
            .collect();

        Ok(prizes)
    }

    fn update_wheel_prizes_order(
        &self,
        request: UpdateWheelPrizesOrderRequest,
    ) -> Result<(), ApiError> {
        // check that the provided wheel asset IDs match all the existing enabled assets
        // and create a vector of `WheelAssetId`s
        let ordered_ids = {
            let enabled_wheel_assets = self
                .wheel_asset_repository
                .list_wheel_assets_by_state(WheelAssetState::Enabled)?;

            let mut ordered_ids = Vec::new();
            for id in &request.wheel_asset_ids {
                let id = WheelAssetId::try_from(id.as_str())?;
                if !enabled_wheel_assets
                    .iter()
                    .any(|(asset_id, _)| *asset_id == id)
                {
                    return Err(ApiError::invalid_argument(&format!(
                        "Wheel asset with ID {} does not exist or is not enabled",
                        id
                    )));
                }
                ordered_ids.push(id);
            }
            ordered_ids
        };

        self.wheel_asset_repository
            .update_wheel_prizes_order(ordered_ids)
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

        if let Some(wheel_ui_settings) = &request.wheel_ui_settings {
            self.validate_wheel_ui_settings(wheel_ui_settings)?;
        }

        match &request.asset_type_config {
            CreateWheelAssetTypeConfig::Token {
                prize_usd_amount, ..
            } => self.validate_wheel_asset_token_prize_usd_amount(prize_usd_amount)?,
            CreateWheelAssetTypeConfig::Jackpot { wheel_asset_ids } => {
                self.validate_wheel_asset_jackpot_asset_ids(wheel_asset_ids)?
            }
            CreateWheelAssetTypeConfig::Gadget { .. } => {}
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
                UpdateWheelAssetTypeConfig::Token {
                    prize_usd_amount, ..
                } => {
                    if let Some(prize_usd_amount) = prize_usd_amount {
                        self.validate_wheel_asset_token_prize_usd_amount(prize_usd_amount)?;
                    }
                }
                UpdateWheelAssetTypeConfig::Jackpot { wheel_asset_ids } => {
                    self.validate_wheel_asset_jackpot_asset_ids(wheel_asset_ids)?
                }
                UpdateWheelAssetTypeConfig::Gadget { .. } => {}
            }
        }

        if let Some(wheel_ui_settings) = &request.wheel_ui_settings {
            self.validate_wheel_ui_settings(wheel_ui_settings)?;
        }

        Ok(())
    }

    fn validate_wheel_ui_settings(
        &self,
        wheel_ui_settings: &WheelAssetUiSettings,
    ) -> Result<(), ApiError> {
        if !WHEEL_ASSET_UI_SETTING_BACKGROUND_COLOR_HEX_REGEX
            .is_match(&wheel_ui_settings.background_color_hex)
        {
            return Err(ApiError::invalid_argument("Invalid background color hex"));
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

    fn validate_wheel_asset_token_prize_usd_amount(&self, amount: &f64) -> Result<(), ApiError> {
        if amount < &MINIMUM_WHEEL_ASSET_TOKEN_PRIZE_USD_AMOUNT {
            return Err(ApiError::invalid_argument(&format!(
                "Prize USD amount must be greater than {MINIMUM_WHEEL_ASSET_TOKEN_PRIZE_USD_AMOUNT}"
            )));
        }
        if amount > &MAXIMUM_WHEEL_ASSET_TOKEN_PRIZE_USD_AMOUNT {
            return Err(ApiError::invalid_argument(&format!(
                "Prize USD amount must be less than {MAXIMUM_WHEEL_ASSET_TOKEN_PRIZE_USD_AMOUNT}"
            )));
        }
        Ok(())
    }

    fn validate_wheel_asset_jackpot_asset_ids(
        &self,
        wheel_asset_ids: &[String],
    ) -> Result<(), ApiError> {
        if wheel_asset_ids.len() < MINIMUM_WHEEL_ASSET_JACKPOT_ASSET_IDS_COUNT
            || wheel_asset_ids.len() > MAXIMUM_WHEEL_ASSET_JACKPOT_ASSET_IDS_COUNT
        {
            return Err(ApiError::invalid_argument(&format!(
                "Jackpot must have between {MINIMUM_WHEEL_ASSET_JACKPOT_ASSET_IDS_COUNT} and {MAXIMUM_WHEEL_ASSET_JACKPOT_ASSET_IDS_COUNT} asset IDs"
            )));
        }
        // Check that there are no duplicates
        let mut seen = HashSet::new();
        for id in wheel_asset_ids {
            if !seen.insert(id) {
                return Err(ApiError::invalid_argument(
                    "Jackpot cannot have duplicate asset IDs",
                ));
            }
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

        spawn(async move {
            WheelAssetServiceImpl::default()
                .fetch_and_save_token_price(asset_id, asset_type)
                .await
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

        match xrc_canister.get_exchange_rate(request).await.unwrap() {
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

        spawn(async move {
            WheelAssetServiceImpl::default()
                .fetch_and_save_token_balance(asset_id, asset_type)
                .await
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
                owner: ic_cdk::api::canister_self(),
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
