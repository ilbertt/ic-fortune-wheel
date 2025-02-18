use candid::{CandidType, Deserialize, Principal};

use crate::ApiError;

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum WheelPrizeExtractionState {
    #[serde(rename = "processing")]
    Processing,
    #[serde(rename = "completed")]
    Completed { wheel_asset_id: String },
    #[serde(rename = "failed")]
    Failed { error: ApiError },
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct WheelPrizeExtraction {
    pub id: String,
    pub extracted_for_principal: Principal,
    pub extracted_by_user_id: String,
    pub state: WheelPrizeExtractionState,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct GetWheelPrizeExtractionRequest {
    pub wheel_prize_extraction_id: String,
}

pub type GetWheelPrizeExtractionResponse = WheelPrizeExtraction;

pub type GetLastWheelPrizeExtractionResponse = Option<WheelPrizeExtraction>;

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct CreateWheelPrizeExtractionRequest {
    pub extract_for_principal: Principal,
}

pub type ListWheelPrizeExtractionsResponse = Vec<WheelPrizeExtraction>;
