use crate::repositories::{
    WheelAsset, WheelAssetId, WheelAssetState, WheelAssetTokenPrice, WheelAssetType,
};

impl From<WheelAssetState> for backend_api::WheelAssetState {
    fn from(state: WheelAssetState) -> Self {
        match state {
            WheelAssetState::Enabled => backend_api::WheelAssetState::Enabled,
            WheelAssetState::Disabled => backend_api::WheelAssetState::Disabled,
        }
    }
}

impl From<backend_api::WheelAssetState> for WheelAssetState {
    fn from(state: backend_api::WheelAssetState) -> Self {
        match state {
            backend_api::WheelAssetState::Enabled => WheelAssetState::Enabled,
            backend_api::WheelAssetState::Disabled => WheelAssetState::Disabled,
        }
    }
}

impl From<WheelAssetTokenPrice> for backend_api::WheelAssetTokenPrice {
    fn from(value: WheelAssetTokenPrice) -> Self {
        backend_api::WheelAssetTokenPrice {
            usd_price: value.usd_price,
            last_fetched_at: value.last_fetched_at.to_string(),
        }
    }
}

impl From<WheelAssetType> for backend_api::WheelAssetType {
    fn from(asset_type: WheelAssetType) -> Self {
        match asset_type {
            WheelAssetType::Token {
                ledger_canister_id,
                exchange_rate_symbol,
                should_fetch_usd_price,
                usd_price,
            } => backend_api::WheelAssetType::Token {
                ledger_canister_id,
                exchange_rate_symbol,
                should_fetch_usd_price,
                usd_price: usd_price.map(|el| el.into()),
            },
            WheelAssetType::Gadget => backend_api::WheelAssetType::Gadget,
            WheelAssetType::Jackpot => backend_api::WheelAssetType::Jackpot,
        }
    }
}

pub fn map_wheel_asset(
    wheel_asset_id: WheelAssetId,
    wheel_asset: WheelAsset,
) -> backend_api::WheelAsset {
    backend_api::WheelAsset {
        id: wheel_asset_id.to_string(),
        name: wheel_asset.name,
        asset_type: wheel_asset.asset_type.into(),
        total_amount: wheel_asset.total_amount,
        used_amount: wheel_asset.used_amount,
        state: wheel_asset.state.into(),
    }
}
