use rstest::*;

use crate::repositories::{TimestampFields, WheelPrizeExtraction, WheelPrizeExtractionState};

use super::uuid;

#[fixture]
pub fn wheel_prize_extraction() -> WheelPrizeExtraction {
    WheelPrizeExtraction {
        wheel_asset_id: uuid(),
        state: WheelPrizeExtractionState::Extracted,
        extracted_by_user_id: uuid(),
        timestamps: TimestampFields::new(),
    }
}
