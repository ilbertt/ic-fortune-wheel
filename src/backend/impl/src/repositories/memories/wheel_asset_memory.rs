use super::{
    Memory, MEMORY_MANAGER, WHEEL_ASSETS_MEMORY_ID, WHEEL_ASSET_STATE_INDEX_MEMORY_ID,
    WHEEL_ASSET_TYPE_INDEX_MEMORY_ID, WHEEL_PRIZE_INDEX_MEMORY_ID,
};

use ic_stable_structures::BTreeMap;

use crate::repositories::{WheelAsset, WheelAssetId, WheelAssetStateKey, WheelAssetTypeKey};

pub type WheelAssetMemory = BTreeMap<WheelAssetId, WheelAsset, Memory>;
pub type WheelAssetStateIndexMemory = BTreeMap<WheelAssetStateKey, WheelAssetId, Memory>;
pub type WheelAssetTypeIndexMemory = BTreeMap<WheelAssetTypeKey, WheelAssetId, Memory>;
pub type WheelPrizeOrderMemory = BTreeMap<u32, WheelAssetId, Memory>;

pub fn init_wheel_assets() -> WheelAssetMemory {
    WheelAssetMemory::init(get_wheel_assets_memory())
}

pub fn init_wheel_asset_state_index() -> WheelAssetStateIndexMemory {
    WheelAssetStateIndexMemory::init(get_wheel_asset_state_index_memory())
}

pub fn init_wheel_asset_type_index() -> WheelAssetTypeIndexMemory {
    WheelAssetTypeIndexMemory::init(get_wheel_asset_type_index_memory())
}

pub fn init_wheel_prize_index() -> WheelPrizeOrderMemory {
    WheelPrizeOrderMemory::init(get_wheel_prize_index_memory())
}

fn get_wheel_assets_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_ASSETS_MEMORY_ID))
}

fn get_wheel_asset_state_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_ASSET_STATE_INDEX_MEMORY_ID))
}

fn get_wheel_asset_type_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_ASSET_TYPE_INDEX_MEMORY_ID))
}

fn get_wheel_prize_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_PRIZE_INDEX_MEMORY_ID))
}
