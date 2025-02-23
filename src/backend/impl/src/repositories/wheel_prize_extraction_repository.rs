use std::cell::RefCell;

use backend_api::ApiError;
use candid::Principal;

use super::{
    init_wheel_prize_extraction_asset_id_index, init_wheel_prize_extraction_principal_index,
    init_wheel_prize_extraction_state_index, init_wheel_prize_extraction_user_id_index,
    init_wheel_prize_extractions, Timestamped, WheelPrizeExtraction,
    WheelPrizeExtractionAssetIdIndexMemory, WheelPrizeExtractionAssetIdKey, WheelPrizeExtractionId,
    WheelPrizeExtractionMemory, WheelPrizeExtractionPrincipalIndexMemory,
    WheelPrizeExtractionState as WheelPrizeExtractionStateEnum,
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

    fn get_wheel_prize_extraction_by_principal(
        &self,
        principal: &Principal,
    ) -> Option<(WheelPrizeExtractionId, WheelPrizeExtraction)>;

    fn list_wheel_prize_extractions(&self) -> Vec<(WheelPrizeExtractionId, WheelPrizeExtraction)>;

    fn create_wheel_prize_extraction(
        &self,
        wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<WheelPrizeExtractionId, ApiError>;

    fn update_wheel_prize_extraction(
        &self,
        id: WheelPrizeExtractionId,
        wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<(), ApiError>;

    fn list_wheel_prize_extractions_by_state(
        &self,
        state: &WheelPrizeExtractionStateEnum,
    ) -> Vec<(WheelPrizeExtractionId, WheelPrizeExtraction)>;
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
                    // SAFETY: wheel prize extraction with this id should always exist
                    .map(|(_, id)| (id, s.wheel_prize_extractions.get(&id).unwrap()))
            }
            None => s.wheel_prize_extractions.last_key_value(),
        })
    }

    fn get_wheel_prize_extraction_by_principal(
        &self,
        principal: &Principal,
    ) -> Option<(WheelPrizeExtractionId, WheelPrizeExtraction)> {
        STATE.with_borrow(|s| {
            s.wheel_prize_extraction_principal_index
                .get(principal)
                // SAFETY: wheel prize extraction with this id should always exist
                .map(|id| (id, s.wheel_prize_extractions.get(&id).unwrap()))
        })
    }

    fn list_wheel_prize_extractions(&self) -> Vec<(WheelPrizeExtractionId, WheelPrizeExtraction)> {
        STATE.with_borrow(|s| s.wheel_prize_extractions.iter().rev().collect())
    }

    fn create_wheel_prize_extraction(
        &self,
        wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<WheelPrizeExtractionId, ApiError> {
        let id = WheelPrizeExtractionId::new();

        STATE.with_borrow_mut(|s| {
            self.insert_wheel_prize_extraction(s, id, wheel_prize_extraction)?;
            Ok(id)
        })
    }

    fn update_wheel_prize_extraction(
        &self,
        id: WheelPrizeExtractionId,
        mut wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            // remove old indexes
            {
                let old_wheel_prize_extraction = s
                    .wheel_prize_extractions
                    .get(&id)
                    .ok_or_else(|| ApiError::not_found("Wheel prize extraction not found"))?;
                let old_state_key =
                    WheelPrizeExtractionStateKey::new(&old_wheel_prize_extraction.state, id)?;
                s.wheel_prize_extraction_state_index.remove(&old_state_key);
                let old_user_id_key = WheelPrizeExtractionUserIdKey::new(
                    old_wheel_prize_extraction.extracted_by_user_id,
                    id,
                )?;
                s.wheel_prize_extraction_user_id_index
                    .remove(&old_user_id_key);
                let old_principal_key = old_wheel_prize_extraction.extracted_for_principal;
                s.wheel_prize_extraction_principal_index
                    .remove(&old_principal_key);
                if let Some(old_asset_id) = old_wheel_prize_extraction.wheel_asset_id {
                    let old_asset_id_key = WheelPrizeExtractionAssetIdKey::new(old_asset_id, id)?;
                    s.wheel_prize_extraction_asset_id_index
                        .remove(&old_asset_id_key);
                }
            }

            // insert new data
            wheel_prize_extraction.update_timestamp();
            self.insert_wheel_prize_extraction(s, id, wheel_prize_extraction)?;

            Ok(())
        })
    }

    fn list_wheel_prize_extractions_by_state(
        &self,
        state: &WheelPrizeExtractionStateEnum,
    ) -> Vec<(WheelPrizeExtractionId, WheelPrizeExtraction)> {
        STATE.with_borrow(|s| {
            let state_range = WheelPrizeExtractionStateRange::new(state).unwrap();
            s.wheel_prize_extraction_state_index
                .range(state_range)
                .map(|(_, id)| {
                    // SAFETY: wheel prize extraction with this id should always exist
                    (id, s.wheel_prize_extractions.get(&id).unwrap())
                })
                .collect()
        })
    }
}

impl WheelPrizeExtractionRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }

    fn set_asset_id_index(
        &self,
        state: &mut WheelPrizeExtractionState,
        id: WheelPrizeExtractionId,
        wheel_prize_extraction: &WheelPrizeExtraction,
    ) -> Result<(), ApiError> {
        if let Some(wheel_asset_id) = wheel_prize_extraction.wheel_asset_id {
            let asset_id_key = WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, id)?;
            state
                .wheel_prize_extraction_asset_id_index
                .insert(asset_id_key, id);
        }
        Ok(())
    }

    fn insert_wheel_prize_extraction(
        &self,
        state: &mut WheelPrizeExtractionState,
        id: WheelPrizeExtractionId,
        wheel_prize_extraction: WheelPrizeExtraction,
    ) -> Result<(), ApiError> {
        let state_key = WheelPrizeExtractionStateKey::new(&wheel_prize_extraction.state, id)?;
        let user_id_key =
            WheelPrizeExtractionUserIdKey::new(wheel_prize_extraction.extracted_by_user_id, id)?;
        let principal_key = wheel_prize_extraction.extracted_for_principal;

        state
            .wheel_prize_extractions
            .insert(id, wheel_prize_extraction.clone());
        state
            .wheel_prize_extraction_state_index
            .insert(state_key, id);
        state
            .wheel_prize_extraction_user_id_index
            .insert(user_id_key, id);
        state
            .wheel_prize_extraction_principal_index
            .insert(principal_key, id);

        self.set_asset_id_index(state, id, &wheel_prize_extraction)?;

        Ok(())
    }
}

struct WheelPrizeExtractionState {
    wheel_prize_extractions: WheelPrizeExtractionMemory,
    wheel_prize_extraction_state_index: WheelPrizeExtractionStateIndexMemory,
    wheel_prize_extraction_asset_id_index: WheelPrizeExtractionAssetIdIndexMemory,
    wheel_prize_extraction_user_id_index: WheelPrizeExtractionUserIdIndexMemory,
    wheel_prize_extraction_principal_index: WheelPrizeExtractionPrincipalIndexMemory,
}

impl Default for WheelPrizeExtractionState {
    fn default() -> Self {
        Self {
            wheel_prize_extractions: init_wheel_prize_extractions(),
            wheel_prize_extraction_state_index: init_wheel_prize_extraction_state_index(),
            wheel_prize_extraction_asset_id_index: init_wheel_prize_extraction_asset_id_index(),
            wheel_prize_extraction_user_id_index: init_wheel_prize_extraction_user_id_index(),
            wheel_prize_extraction_principal_index: init_wheel_prize_extraction_principal_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<WheelPrizeExtractionState> = RefCell::new(WheelPrizeExtractionState::default());
}
