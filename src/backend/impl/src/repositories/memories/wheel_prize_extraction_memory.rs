use ic_stable_structures::BTreeMap;

use crate::repositories::{
    WheelPrizeExtraction, WheelPrizeExtractionAssetIdKey, WheelPrizeExtractionId,
    WheelPrizeExtractionStateKey, WheelPrizeExtractionUserIdKey,
};

use super::{
    memory_manager::MEMORY_MANAGER, Memory, WHEEL_PRIZE_EXTRACTIONS_MEMORY_ID,
    WHEEL_PRIZE_EXTRACTION_ASSET_ID_INDEX_MEMORY_ID, WHEEL_PRIZE_EXTRACTION_STATE_INDEX_MEMORY_ID,
    WHEEL_PRIZE_EXTRACTION_USER_ID_INDEX_MEMORY_ID,
};

pub type WheelPrizeExtractionMemory =
    BTreeMap<WheelPrizeExtractionId, WheelPrizeExtraction, Memory>;
pub type WheelPrizeExtractionStateIndexMemory =
    BTreeMap<WheelPrizeExtractionStateKey, WheelPrizeExtractionId, Memory>;
pub type WheelPrizeExtractionAssetIdIndexMemory =
    BTreeMap<WheelPrizeExtractionAssetIdKey, WheelPrizeExtractionId, Memory>;
pub type WheelPrizeExtractionUserIdIndexMemory =
    BTreeMap<WheelPrizeExtractionUserIdKey, WheelPrizeExtractionId, Memory>;

pub fn init_wheel_prize_extractions() -> WheelPrizeExtractionMemory {
    WheelPrizeExtractionMemory::init(get_wheel_prize_extractions_memory())
}

pub fn init_wheel_prize_extraction_state_index() -> WheelPrizeExtractionStateIndexMemory {
    WheelPrizeExtractionStateIndexMemory::init(get_wheel_prize_extraction_state_index_memory())
}

pub fn init_wheel_prize_extraction_asset_id_index() -> WheelPrizeExtractionAssetIdIndexMemory {
    WheelPrizeExtractionAssetIdIndexMemory::init(get_wheel_prize_extraction_asset_id_index_memory())
}

pub fn init_wheel_prize_extraction_user_id_index() -> WheelPrizeExtractionUserIdIndexMemory {
    WheelPrizeExtractionUserIdIndexMemory::init(get_wheel_prize_extraction_user_id_index_memory())
}

fn get_wheel_prize_extractions_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_PRIZE_EXTRACTIONS_MEMORY_ID))
}

fn get_wheel_prize_extraction_state_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(WHEEL_PRIZE_EXTRACTION_STATE_INDEX_MEMORY_ID))
}

fn get_wheel_prize_extraction_asset_id_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| {
        m.borrow()
            .get(WHEEL_PRIZE_EXTRACTION_ASSET_ID_INDEX_MEMORY_ID)
    })
}

fn get_wheel_prize_extraction_user_id_index_memory() -> Memory {
    MEMORY_MANAGER.with(|m| {
        m.borrow()
            .get(WHEEL_PRIZE_EXTRACTION_USER_ID_INDEX_MEMORY_ID)
    })
}
