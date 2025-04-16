use std::path::PathBuf;

use common_types::TimestampFields;
use rstest::*;

use crate::repositories::{
    HttpAssetPath, WheelAsset, WheelAssetId, WheelAssetState, WheelAssetType, WheelAssetUiSettings,
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
        timestamps: TimestampFields::default(),
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
        timestamps: TimestampFields::default(),
    }
}

#[fixture]
pub fn wheel_asset_jackpot() -> WheelAsset {
    WheelAsset {
        name: "Jackpot1".to_string(),
        asset_type: WheelAssetType::Jackpot {
            wheel_asset_ids: vec![
                WheelAssetId::try_from("0195aacc-f240-7417-8b63-c38f24401a3f").unwrap(),
                WheelAssetId::try_from("0195aacd-34a1-7bb2-a325-c4a98b41c287").unwrap(),
                WheelAssetId::try_from("0195aacd-5bad-7c7b-907a-fbf9e4a46763").unwrap(),
                WheelAssetId::try_from("0195aace-6362-730a-87b4-074892fff602").unwrap(),
            ],
        },
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
        timestamps: TimestampFields::default(),
    }
}
