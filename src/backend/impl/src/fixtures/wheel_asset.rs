use std::path::PathBuf;

use rstest::*;

use crate::repositories::{
    HttpAssetPath, TimestampFields, WheelAsset, WheelAssetState, WheelAssetType,
};

#[fixture]
pub fn wheel_asset_token() -> WheelAsset {
    WheelAsset {
        name: "Token1".to_string(),
        asset_type: WheelAssetType::empty_token(),
        total_amount: 100,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        wheel_image_path: Some(HttpAssetPath::new(PathBuf::from(
            "/images/wheel/3c795f91-0c9b-4430-a1a5-c190f5d3e65e",
        ))),
        modal_image_path: Some(HttpAssetPath::new(PathBuf::from(
            "/images/wheel/93bb6c68-19bd-4fe9-9f3d-10f7183a07e2",
        ))),
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
        wheel_image_path: Some(HttpAssetPath::new(PathBuf::from(
            "/images/wheel/ff11afba-98d7-4ff8-9125-58daffbf2a95",
        ))),
        modal_image_path: None,
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
        wheel_image_path: None,
        modal_image_path: Some(HttpAssetPath::new(PathBuf::from(
            "/images/wheel/b92ef0de-f308-4b67-9d90-c7a3bf961031",
        ))),
        timestamps: TimestampFields::new(),
    }
}
