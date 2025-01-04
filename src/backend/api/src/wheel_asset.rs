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
pub struct WheelAssetTokenLedgerConfig {
    pub ledger_canister_id: Principal,
    pub decimals: u8,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum WheelAssetType {
    #[serde(rename = "token")]
    Token {
        ledger_config: WheelAssetTokenLedgerConfig,
        exchange_rate_symbol: Option<String>,
        usd_price: Option<WheelAssetTokenPrice>,
        balance: Option<WheelAssetTokenBalance>,
        available_draws_count: u32,
        prize_usd_amount: f64,
    },
    #[serde(rename = "gadget")]
    Gadget { article_type: Option<String> },
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
    pub wheel_image_path: Option<String>,
    pub modal_image_path: Option<String>,
    pub state: WheelAssetState,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum CreateWheelAssetTypeConfig {
    #[serde(rename = "token")]
    Token {
        ledger_config: WheelAssetTokenLedgerConfig,
        exchange_rate_symbol: Option<String>,
        prize_usd_amount: f64,
    },
    #[serde(rename = "gadget")]
    Gadget { article_type: Option<String> },
    #[serde(rename = "jackpot")]
    Jackpot,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct CreateWheelAssetRequest {
    pub name: String,
    pub asset_type_config: CreateWheelAssetTypeConfig,
    pub total_amount: u32,
}

pub type CreateWheelAssetResponse = WheelAsset;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum UpdateWheelAssetTypeConfig {
    #[serde(rename = "token")]
    Token { prize_usd_amount: Option<f64> },
    #[serde(rename = "gadget")]
    Gadget { article_type: Option<String> },
    #[serde(rename = "jackpot")]
    Jackpot,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct UpdateWheelAssetRequest {
    pub id: String,
    pub name: Option<String>,
    pub total_amount: Option<u32>,
    pub used_amount: Option<u32>,
    pub state: Option<WheelAssetState>,
    pub asset_type_config: Option<UpdateWheelAssetTypeConfig>,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct ListWheelAssetsRequest {
    pub state: Option<WheelAssetState>,
}

pub type ListWheelAssetsResponse = Vec<WheelAsset>;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct DeleteWheelAssetRequest {
    pub id: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct WheelAssetImageConfig {
    pub content_type: String,
    pub content_bytes: Vec<u8>,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum UpdateWheelAssetImageConfig {
    #[serde(rename = "wheel")]
    Wheel(WheelAssetImageConfig),
    #[serde(rename = "modal")]
    Modal(WheelAssetImageConfig),
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct UpdateWheelAssetImageRequest {
    pub id: String,
    pub image_config: UpdateWheelAssetImageConfig,
}
