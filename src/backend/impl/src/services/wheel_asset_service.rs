use std::time::Duration;

use backend_api::{ApiError, ListWheelAssetsRequest, ListWheelAssetsResponse};
use external_canisters::xrc::ExchangeRateCanisterService;
use ic_cdk::{println, spawn};
use ic_cdk_timers::set_timer;
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest};

use crate::{
    mappings::map_wheel_asset,
    repositories::{
        ckbtc_wheel_asset, cketh_wheel_asset, ckusdc_wheel_asset, icp_wheel_asset, WheelAsset,
        WheelAssetId, WheelAssetRepository, WheelAssetRepositoryImpl, WheelAssetTokenPrice,
        WheelAssetType,
    },
};

#[cfg_attr(test, mockall::automock)]
pub trait WheelAssetService {
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError>;

    async fn set_default_wheel_assets(&self) -> Result<(), ApiError>;

    fn fetch_tokens_prices(&self) -> Result<(), ApiError>;
}

pub struct WheelAssetServiceImpl<W: WheelAssetRepository> {
    wheel_asset_repository: W,
}

impl Default for WheelAssetServiceImpl<WheelAssetRepositoryImpl> {
    fn default() -> Self {
        Self::new(WheelAssetRepositoryImpl::default())
    }
}

impl<W: WheelAssetRepository> WheelAssetService for WheelAssetServiceImpl<W> {
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

        for asset in [
            icp_wheel_asset(),
            ckbtc_wheel_asset(),
            cketh_wheel_asset(),
            ckusdc_wheel_asset(),
        ] {
            let asset_id = self
                .wheel_asset_repository
                .create_wheel_asset(asset.clone())
                .await?;

            self.schedule_price_fetcher(asset_id, asset);
        }

        Ok(())
    }

    fn fetch_tokens_prices(&self) -> Result<(), ApiError> {
        let token_assets = self
            .wheel_asset_repository
            .list_wheel_assets_by_type(&WheelAssetType::empty_token())?;

        for (asset_id, asset) in token_assets {
            self.schedule_price_fetcher(asset_id, asset);
        }

        println!("fetch_token_prices: Scheduled all price fetchers");

        Ok(())
    }
}

impl<W: WheelAssetRepository> WheelAssetServiceImpl<W> {
    fn new(wheel_asset_repository: W) -> Self {
        Self {
            wheel_asset_repository,
        }
    }

    /// Immediately (= after 0 seconds) starts a task to fetch the price of the given asset,
    /// if the asset has a price that should be fetched.
    fn schedule_price_fetcher(&self, asset_id: WheelAssetId, asset: WheelAsset) {
        if !asset.should_fetch_usd_price() {
            return;
        }

        println!(
            "schedule_price_fetcher: Scheduling price fetcher for asset {}",
            asset_id
        );

        set_timer(Duration::from_secs(0), move || {
            spawn(async move {
                WheelAssetServiceImpl::default()
                    .fetch_and_save_token_price(asset_id, asset)
                    .await
            });
        });
    }

    async fn fetch_and_save_token_price(&self, asset_id: WheelAssetId, mut asset: WheelAsset) {
        println!(
            "fetch_and_save_token_price: Fetching price for asset {}",
            asset_id
        );

        let symbol = match &asset.asset_type {
            WheelAssetType::Token {
                exchange_rate_symbol,
                ..
            } => exchange_rate_symbol,
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
                    "fetch_and_save_token_price: Successfully fetched price for asset {}",
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
}
