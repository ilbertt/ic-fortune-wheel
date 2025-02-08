use std::cell::RefCell;

use backend_api::ApiError;

use super::{
    init_wheel_prize_extraction_asset_id_index, init_wheel_prize_extraction_state_index,
    init_wheel_prize_extraction_user_id_index, init_wheel_prize_extractions, WheelPrizeExtraction,
    WheelPrizeExtractionAssetIdIndexMemory, WheelPrizeExtractionAssetIdKey, WheelPrizeExtractionId,
    WheelPrizeExtractionMemory, WheelPrizeExtractionState as WheelPrizeExtractionStateEnum,
    WheelPrizeExtractionStateIndexMemory, WheelPrizeExtractionStateKey,
    WheelPrizeExtractionStateRange, WheelPrizeExtractionUserIdIndexMemory,
    WheelPrizeExtractionUserIdKey,
};

#[cfg_attr(test, mockall::automock)]
#[allow(clippy::needless_lifetimes)]
pub trait WheelPrizeExtractionRepository {
    fn get_wheel_prize_extraction(
        &self,
        id: &WheelPrizeExtractionId,
    ) -> Option<WheelPrizeExtraction>;

    fn get_last_wheel_prize_extraction<'a>(
        &self,
        state: Option<&'a WheelPrizeExtractionStateEnum>,
    ) -> Option<(WheelPrizeExtractionId, WheelPrizeExtraction)>;

    async fn create_wheel_prize_extraction(
        &self,
        wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<WheelPrizeExtractionId, ApiError>;
}

pub struct WheelPrizeExtractionRepositoryImpl {}

impl Default for WheelPrizeExtractionRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl WheelPrizeExtractionRepository for WheelPrizeExtractionRepositoryImpl {
    fn get_wheel_prize_extraction(
        &self,
        id: &WheelPrizeExtractionId,
    ) -> Option<WheelPrizeExtraction> {
        STATE.with_borrow(|s| s.wheel_prize_extractions.get(id))
    }

    fn get_last_wheel_prize_extraction(
        &self,
        state: Option<&WheelPrizeExtractionStateEnum>,
    ) -> Option<(WheelPrizeExtractionId, WheelPrizeExtraction)> {
        // items are indexed by uuid v7, which already has the timestamp included
        STATE.with_borrow(|s| match state {
            Some(state) => {
                let state_range = WheelPrizeExtractionStateRange::new(state).unwrap();
                s.wheel_prize_extraction_state_index
                    .range(state_range)
                    .last()
                    // SAFETY: wheel prize extraction with this id should always exists
                    .map(|(_, id)| (id, s.wheel_prize_extractions.get(&id).unwrap()))
            }
            None => s.wheel_prize_extractions.last_key_value(),
        })
    }

    async fn create_wheel_prize_extraction(
        &self,
        wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<WheelPrizeExtractionId, ApiError> {
        let id = WheelPrizeExtractionId::new().await?;
        let state_key = WheelPrizeExtractionStateKey::new(&wheel_prize_extraction.state, id)?;
        let asset_id_key =
            WheelPrizeExtractionAssetIdKey::new(wheel_prize_extraction.wheel_asset_id, id)?;
        let user_id_key =
            WheelPrizeExtractionUserIdKey::new(wheel_prize_extraction.extracted_by_user_id, id)?;

        STATE.with_borrow_mut(|s| {
            s.wheel_prize_extractions.insert(id, wheel_prize_extraction);
            s.wheel_prize_extraction_state_index.insert(state_key, id);
            s.wheel_prize_extraction_asset_id_index
                .insert(asset_id_key, id);
            s.wheel_prize_extraction_user_id_index
                .insert(user_id_key, id);
        });

        Ok(id)
    }
}

impl WheelPrizeExtractionRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct WheelPrizeExtractionState {
    wheel_prize_extractions: WheelPrizeExtractionMemory,
    wheel_prize_extraction_state_index: WheelPrizeExtractionStateIndexMemory,
    wheel_prize_extraction_asset_id_index: WheelPrizeExtractionAssetIdIndexMemory,
    wheel_prize_extraction_user_id_index: WheelPrizeExtractionUserIdIndexMemory,
}

impl Default for WheelPrizeExtractionState {
    fn default() -> Self {
        Self {
            wheel_prize_extractions: init_wheel_prize_extractions(),
            wheel_prize_extraction_state_index: init_wheel_prize_extraction_state_index(),
            wheel_prize_extraction_asset_id_index: init_wheel_prize_extraction_asset_id_index(),
            wheel_prize_extraction_user_id_index: init_wheel_prize_extraction_user_id_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<WheelPrizeExtractionState> = RefCell::new(WheelPrizeExtractionState::default());
}
