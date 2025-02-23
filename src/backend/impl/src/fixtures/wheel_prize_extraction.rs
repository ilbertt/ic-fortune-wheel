use backend_api::ApiError;
use rstest::*;

use crate::repositories::{
    TimestampFields, WheelPrizeExtraction, WheelPrizeExtractionOld, WheelPrizeExtractionState,
    WheelPrizeExtractionStateOld,
};

use super::{principal, uuid};

#[fixture]
pub fn wheel_prize_extraction() -> WheelPrizeExtraction {
    WheelPrizeExtraction {
        extracted_for_principal: principal(),
        state: WheelPrizeExtractionState::Completed {
            prize_usd_amount: Some(2.3),
        },
        extracted_by_user_id: uuid(),
        timestamps: TimestampFields::new(),
        wheel_asset_id: Some(uuid()),
    }
}

#[fixture]
pub fn old_wheel_prize_extraction_completed() -> WheelPrizeExtractionOld {
    WheelPrizeExtractionOld {
        extracted_for_principal: principal(),
        state: WheelPrizeExtractionStateOld::Completed {
            wheel_asset_id: uuid(),
            prize_usd_amount: Some(2.3),
        },
        extracted_by_user_id: uuid(),
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn old_wheel_prize_extraction_pending() -> WheelPrizeExtractionOld {
    WheelPrizeExtractionOld {
        extracted_for_principal: principal(),
        state: WheelPrizeExtractionStateOld::Completed {
            wheel_asset_id: uuid(),
            prize_usd_amount: Some(2.3),
        },
        extracted_by_user_id: uuid(),
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn old_wheel_prize_extraction_failed() -> WheelPrizeExtractionOld {
    WheelPrizeExtractionOld {
        extracted_for_principal: principal(),
        state: WheelPrizeExtractionStateOld::Failed {
            error: ApiError::internal("error"),
        },
        extracted_by_user_id: uuid(),
        timestamps: TimestampFields::new(),
    }
}
