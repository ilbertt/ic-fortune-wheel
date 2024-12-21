use candid::{CandidType, Deserialize, Principal};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum WheelAssetState {
    #[serde(rename = "enabled")]
    Enabled,
    #[serde(rename = "disabled")]
    Disabled,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum WheelAssetType {
    #[serde(rename = "token")]
    Token { ledger_canister_id: Principal },
    #[serde(rename = "gadget")]
    Gadget,
    #[serde(rename = "jackpot")]
    Jackpot,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct WheelAsset {
    pub id: String,
    pub name: String,
    pub asset_type: WheelAssetType,
    pub total_amount: u32,
    pub used_amount: u32,
    pub state: WheelAssetState,
}

pub type CreateWheelAssetResponse = WheelAsset;

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateWheelAssetRequest {
    pub id: String,
    pub name: Option<String>,
    pub total_amount: Option<u32>,
    pub used_amount: Option<u32>,
    pub state: Option<WheelAssetState>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct ListWheelAssetsRequest {
    pub state: Option<WheelAssetState>,
}

pub type ListWheelAssetsResponse = Vec<WheelAsset>;
