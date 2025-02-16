use rstest::*;

use crate::repositories::{TimestampFields, WheelPrizeExtraction, WheelPrizeExtractionState};

use super::{principal, uuid};

#[fixture]
pub fn wheel_prize_extraction() -> WheelPrizeExtraction {
    WheelPrizeExtraction {
        extracted_for_principal: principal(),
        state: WheelPrizeExtractionState::Completed {
            wheel_asset_id: uuid(),
        },
        extracted_by_user_id: uuid(),
        timestamps: TimestampFields::new(),
    }
}
