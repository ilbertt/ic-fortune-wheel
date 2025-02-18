use crate::repositories::{
    WheelPrizeExtraction, WheelPrizeExtractionId, WheelPrizeExtractionState,
};

impl From<&WheelPrizeExtractionState> for backend_api::WheelPrizeExtractionState {
    fn from(state: &WheelPrizeExtractionState) -> Self {
        match state {
            WheelPrizeExtractionState::Processing => {
                backend_api::WheelPrizeExtractionState::Processing
            }
            WheelPrizeExtractionState::Completed { wheel_asset_id } => {
                backend_api::WheelPrizeExtractionState::Completed {
                    wheel_asset_id: wheel_asset_id.to_string(),
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
    }
}
