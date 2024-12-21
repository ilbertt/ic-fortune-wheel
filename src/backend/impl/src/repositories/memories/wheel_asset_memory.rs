use super::{Memory, MEMORY_MANAGER, WHEEL_ASSETS_MEMORY_ID, WHEEL_ASSET_STATE_INDEX_MEMORY_ID};

use ic_stable_structures::BTreeMap;

use crate::repositories::{WheelAsset, WheelAssetId, WheelAssetStateKey};

pub type WheelAssetMemory = BTreeMap<WheelAssetId, WheelAsset, Memory>;
pub type WheelAssetStateIndexMemory = BTreeMap<WheelAssetStateKey, WheelAssetId, Memory>;

pub fn init_wheel_assets() -> WheelAssetMemory {
    WheelAssetMemory::init(get_wheel_assets_memory())
}

pub fn init_wheel_asset_state_index() -> WheelAssetStateIndexMemory {
    WheelAssetStateIndexMemory::init(get_wheel_asset_state_index_memory())
}

pub fn get_wheel_assets_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_ASSETS_MEMORY_ID))
}

pub fn get_wheel_asset_state_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_ASSET_STATE_INDEX_MEMORY_ID))
}
