use rstest::*;

use crate::repositories::{TimestampFields, WheelAsset, WheelAssetState, WheelAssetType};

#[fixture]
pub fn wheel_asset_token() -> WheelAsset {
    WheelAsset {
        name: "Token1".to_string(),
        asset_type: WheelAssetType::empty_token(),
        total_amount: 100,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn wheel_asset_gadget() -> WheelAsset {
    WheelAsset {
        name: "Gadget1".to_string(),
        asset_type: WheelAssetType::Gadget,
        total_amount: 100,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn wheel_asset_jackpot() -> WheelAsset {
    WheelAsset {
        name: "Jackpot1".to_string(),
        asset_type: WheelAssetType::Jackpot,
        total_amount: 100,
        used_amount: 0,
        state: WheelAssetState::Disabled,
        timestamps: TimestampFields::new(),
    }
}
