use candid::{CandidType, Deserialize, Principal};

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum WheelAssetState {
    #[serde(rename = "enabled")]
    Enabled,
    #[serde(rename = "disabled")]
    Disabled,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct WheelAssetTokenPrice {
    pub usd_price: f64,
    pub last_fetched_at: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct WheelAssetTokenBalance {
    pub balance: u128,
    pub last_fetched_at: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum WheelAssetType {
    #[serde(rename = "token")]
    Token {
        ledger_canister_id: Principal,
        exchange_rate_symbol: String,
        should_fetch_usd_price: bool,
        usd_price: Option<WheelAssetTokenPrice>,
        decimals: u8,
        balance: Option<WheelAssetTokenBalance>,
        prize_usd_amount: f64,
    },
    #[serde(rename = "gadget")]
    Gadget,
    #[serde(rename = "jackpot")]
    Jackpot,
}

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct WheelAsset {
    pub id: String,
    pub name: String,
    pub asset_type: WheelAssetType,
    pub total_amount: u32,
    pub used_amount: u32,
    pub state: WheelAssetState,
}

pub type CreateWheelAssetResponse = WheelAsset;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct UpdateWheelAssetRequest {
    pub id: String,
    pub name: Option<String>,
    pub total_amount: Option<u32>,
    pub used_amount: Option<u32>,
    pub state: Option<WheelAssetState>,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ListWheelAssetsRequest {
    pub state: Option<WheelAssetState>,
}

pub type ListWheelAssetsResponse = Vec<WheelAsset>;
