use candid::{CandidType, Deserialize};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum WheelPrizeExtractionState {
    #[serde(rename = "extracting")]
    Extracting,
    #[serde(rename = "extracted")]
    Extracted,
    #[serde(rename = "failed")]
    Failed,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct WheelPrizeExtraction {
    pub id: String,
    pub wheel_asset_id: String,
    pub extracted_by_user_id: String,
    pub state: WheelPrizeExtractionState,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct GetWheelPrizeExtractionRequest {
    pub wheel_prize_extraction_id: String,
}

pub type GetWheelPrizeExtractionResponse = WheelPrizeExtraction;

pub type GetLastWheelPrizeExtractionResponse = Option<WheelPrizeExtraction>;
