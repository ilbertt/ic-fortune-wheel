use std::path::PathBuf;

use rstest::*;

use crate::repositories::{
    HttpAssetPath, TimestampFields, WheelAsset, WheelAssetState, WheelAssetType,
    WheelAssetUiSettings,
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
            "/images/wheel/0194e5e5-8e80-7baa-9ed8-90e05f8c7d27",
        ))),
        modal_image_path: Some(HttpAssetPath::new(PathBuf::from(
            "/images/wheel/0194e5e5-af3e-7d13-9eef-62dc128cdc95",
        ))),
        wheel_ui_settings: WheelAssetUiSettings {
            background_color_hex: "#ffffff".to_string(),
        },
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn wheel_asset_gadget() -> WheelAsset {
    WheelAsset {
        name: "Gadget1".to_string(),
        asset_type: WheelAssetType::Gadget {
            article_type: Some("article_type1".to_string()),
        },
        total_amount: 100,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        wheel_image_path: Some(HttpAssetPath::new(PathBuf::from(
            "/images/wheel/0194e5e5-d375-7788-a9a4-2a833313ed65",
        ))),
        modal_image_path: None,
        wheel_ui_settings: WheelAssetUiSettings {
            background_color_hex: "#ffffff".to_string(),
        },
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
            "/images/wheel/0194e5e6-044b-7e5b-b841-c479037e38e0",
        ))),
        wheel_ui_settings: WheelAssetUiSettings {
            background_color_hex: "#ffffff".to_string(),
        },
        timestamps: TimestampFields::new(),
    }
}
