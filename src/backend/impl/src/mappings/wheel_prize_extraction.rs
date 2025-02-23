use crate::repositories::{
    WheelPrizeExtraction, WheelPrizeExtractionId, WheelPrizeExtractionState,
};

impl From<&WheelPrizeExtractionState> for backend_api::WheelPrizeExtractionState {
    fn from(state: &WheelPrizeExtractionState) -> Self {
        match state {
            WheelPrizeExtractionState::Processing => {
                backend_api::WheelPrizeExtractionState::Processing
            }
            WheelPrizeExtractionState::Completed { prize_usd_amount } => {
                backend_api::WheelPrizeExtractionState::Completed {
                    prize_usd_amount: *prize_usd_amount,
                }
            }
            WheelPrizeExtractionState::Failed { error } => {
                backend_api::WheelPrizeExtractionState::Failed {
                    error: error.clone(),
                }
            }
        }
    }
}

impl From<WheelPrizeExtractionState> for backend_api::WheelPrizeExtractionState {
    fn from(state: WheelPrizeExtractionState) -> Self {
        (&state).into()
    }
}

pub fn map_wheel_prize_extraction(
    wheel_prize_extraction_id: WheelPrizeExtractionId,
    wheel_prize_extraction: WheelPrizeExtraction,
) -> backend_api::WheelPrizeExtraction {
    backend_api::WheelPrizeExtraction {
        id: wheel_prize_extraction_id.to_string(),
        extracted_for_principal: wheel_prize_extraction.extracted_for_principal,
        extracted_by_user_id: wheel_prize_extraction.extracted_by_user_id.to_string(),
        state: wheel_prize_extraction.state.into(),
        wheel_asset_id: wheel_prize_extraction
            .wheel_asset_id
            .map(|id| id.to_string()),
        created_at: wheel_prize_extraction.timestamps.created_at.to_string(),
        updated_at: wheel_prize_extraction.timestamps.updated_at.to_string(),
    }
}
