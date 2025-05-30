use backend_api::ApiError;

use crate::repositories::{
    WheelAsset, WheelAssetId, WheelAssetState, WheelAssetTokenBalance, WheelAssetTokenLedgerConfig,
    WheelAssetTokenPrice, WheelAssetType, WheelAssetUiSettings,
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

impl From<WheelAssetTokenBalance> for backend_api::WheelAssetTokenBalance {
    fn from(value: WheelAssetTokenBalance) -> Self {
        backend_api::WheelAssetTokenBalance {
            balance: value.balance,
            last_fetched_at: value.last_fetched_at.to_string(),
        }
    }
}

impl From<WheelAssetTokenLedgerConfig> for backend_api::WheelAssetTokenLedgerConfig {
    fn from(value: WheelAssetTokenLedgerConfig) -> Self {
        backend_api::WheelAssetTokenLedgerConfig {
            ledger_canister_id: value.ledger_canister_id,
            decimals: value.decimals,
        }
    }
}

impl From<backend_api::WheelAssetTokenLedgerConfig> for WheelAssetTokenLedgerConfig {
    fn from(value: backend_api::WheelAssetTokenLedgerConfig) -> Self {
        WheelAssetTokenLedgerConfig {
            ledger_canister_id: value.ledger_canister_id,
            decimals: value.decimals,
        }
    }
}

impl From<WheelAssetType> for backend_api::WheelAssetType {
    fn from(asset_type: WheelAssetType) -> Self {
        match asset_type.clone() {
            WheelAssetType::Token {
                ledger_config,
                exchange_rate_symbol,
                usd_price,
                balance,
                prize_usd_amount,
            } => backend_api::WheelAssetType::Token {
                ledger_config: ledger_config.into(),
                exchange_rate_symbol,
                usd_price: usd_price.map(|el| el.into()),
                balance: balance.map(|el| el.into()),
                prize_usd_amount,
                available_draws_count: asset_type.available_token_draws_count().unwrap_or(0),
            },
            WheelAssetType::Gadget { article_type } => {
                backend_api::WheelAssetType::Gadget { article_type }
            }
            WheelAssetType::Jackpot { wheel_asset_ids } => backend_api::WheelAssetType::Jackpot {
                wheel_asset_ids: wheel_asset_ids.iter().map(|el| el.to_string()).collect(),
            },
        }
    }
}

pub fn into_wheel_asset_ids(value: Vec<String>) -> Result<Vec<WheelAssetId>, ApiError> {
    value
        .iter()
        .map(|el| WheelAssetId::try_from(el.as_str()))
        .collect::<Result<Vec<_>, _>>()
}

impl TryFrom<backend_api::CreateWheelAssetTypeConfig> for WheelAssetType {
    type Error = ApiError;

    fn try_from(value: backend_api::CreateWheelAssetTypeConfig) -> Result<Self, Self::Error> {
        let wheel_asset_type = match value {
            backend_api::CreateWheelAssetTypeConfig::Token {
                ledger_config,
                exchange_rate_symbol,
                prize_usd_amount,
            } => WheelAssetType::Token {
                ledger_config: ledger_config.into(),
                usd_price: match &exchange_rate_symbol {
                    Some(_) => None,
                    None => Some(WheelAssetTokenPrice::default_price()),
                },
                exchange_rate_symbol,
                balance: None,
                prize_usd_amount,
            },
            backend_api::CreateWheelAssetTypeConfig::Gadget { article_type } => {
                WheelAssetType::Gadget { article_type }
            }
            backend_api::CreateWheelAssetTypeConfig::Jackpot { wheel_asset_ids } => {
                WheelAssetType::Jackpot {
                    wheel_asset_ids: into_wheel_asset_ids(wheel_asset_ids)?,
                }
            }
        };
        Ok(wheel_asset_type)
    }
}

impl From<WheelAssetUiSettings> for backend_api::WheelAssetUiSettings {
    fn from(value: WheelAssetUiSettings) -> Self {
        Self {
            background_color_hex: value.background_color_hex,
        }
    }
}

impl From<backend_api::WheelAssetUiSettings> for WheelAssetUiSettings {
    fn from(value: backend_api::WheelAssetUiSettings) -> Self {
        Self {
            background_color_hex: value.background_color_hex,
        }
    }
}

pub fn map_wheel_asset(
    wheel_asset_id: WheelAssetId,
    wheel_asset: WheelAsset,
) -> backend_api::WheelAsset {
    let available_amount = wheel_asset.available_quantity();
    backend_api::WheelAsset {
        id: wheel_asset_id.to_string(),
        name: wheel_asset.name,
        asset_type: wheel_asset.asset_type.into(),
        total_amount: wheel_asset.total_amount,
        used_amount: wheel_asset.used_amount,
        available_amount,
        state: wheel_asset.state.into(),
        wheel_image_path: wheel_asset.wheel_image_path.map(|el| el.to_string()),
        modal_image_path: wheel_asset.modal_image_path.map(|el| el.to_string()),
        wheel_ui_settings: wheel_asset.wheel_ui_settings.into(),
    }
}

pub fn map_wheel_prize(
    wheel_asset_id: WheelAssetId,
    wheel_asset: WheelAsset,
) -> backend_api::WheelPrize {
    let is_token = wheel_asset.is_token();
    let wheel_image_path = wheel_asset
        .wheel_image_path
        .clone()
        .map(|el| el.to_string());
    let modal_image_path = wheel_asset
        .modal_image_path
        .clone()
        .map(|el| el.to_string())
        .or_else(|| {
            // if the wheel asset is a token, use the token image as the modal image
            if is_token {
                wheel_image_path.clone()
            } else {
                None
            }
        });
    backend_api::WheelPrize {
        wheel_asset_id: wheel_asset_id.to_string(),
        name: wheel_asset.clone().name,
        wheel_image_path,
        modal_image_path,
        wheel_ui_settings: wheel_asset.wheel_ui_settings.clone().into(),
        prize_usd_amount: wheel_asset.prize_usd_amount(),
    }
}
