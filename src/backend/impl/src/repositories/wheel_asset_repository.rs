use std::cell::RefCell;

use backend_api::ApiError;

use super::{
    init_wheel_asset_state_index, init_wheel_asset_type_index, init_wheel_assets,
    init_wheel_prize_index, Timestamped, WheelAsset, WheelAssetId, WheelAssetMemory,
    WheelAssetState as WheelAssetStateEnum, WheelAssetStateIndexMemory, WheelAssetStateKey,
    WheelAssetStateRange, WheelAssetType, WheelAssetTypeIndexMemory, WheelAssetTypeKey,
    WheelAssetTypeRange, WheelPrizeOrderMemory,
};

#[cfg_attr(test, mockall::automock)]
pub trait WheelAssetRepository {
    fn get_wheel_asset(&self, id: &WheelAssetId) -> Option<WheelAsset>;

    async fn create_wheel_asset(&self, asset: WheelAsset) -> Result<WheelAssetId, ApiError>;

    fn update_wheel_asset(&self, id: WheelAssetId, asset: WheelAsset) -> Result<(), ApiError>;

    fn delete_wheel_asset(&self, id: &WheelAssetId) -> Result<(), ApiError>;

    fn list_wheel_assets_by_state(
        &self,
        state: WheelAssetStateEnum,
    ) -> Result<Vec<(WheelAssetId, WheelAsset)>, ApiError>;

    fn list_wheel_assets_by_type(
        &self,
        state: &WheelAssetType,
    ) -> Result<Vec<(WheelAssetId, WheelAsset)>, ApiError>;

    fn list_wheel_assets(&self) -> Vec<(WheelAssetId, WheelAsset)>;

    fn get_wheel_prizes_order(&self) -> Vec<WheelAssetId>;

    fn update_wheel_prizes_order(&self, order: Vec<WheelAssetId>) -> Result<(), ApiError>;
}

pub struct WheelAssetRepositoryImpl {}

impl Default for WheelAssetRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl WheelAssetRepository for WheelAssetRepositoryImpl {
    fn get_wheel_asset(&self, id: &WheelAssetId) -> Option<WheelAsset> {
        STATE.with_borrow(|s| s.wheel_assets.get(id))
    }

    async fn create_wheel_asset(&self, asset: WheelAsset) -> Result<WheelAssetId, ApiError> {
        let id = WheelAssetId::new().await?;
        let state_key = WheelAssetStateKey::new(asset.state, id)?;
        let asset_type_key = WheelAssetTypeKey::new(&asset.asset_type, id)?;

        STATE.with_borrow_mut(|s| {
            s.wheel_assets.insert(id, asset.clone());
            s.wheel_asset_state_index.insert(state_key, id);
            s.wheel_asset_type_index.insert(asset_type_key, id);

            if asset.is_enabled() {
                self.add_wheel_prize_to_order(&mut s.wheel_prize_index, id);
            }

            Ok(id)
        })
    }

    fn update_wheel_asset(&self, id: WheelAssetId, mut asset: WheelAsset) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            let old_asset = s
                .wheel_assets
                .get(&id)
                .ok_or_else(|| ApiError::not_found("Wheel asset"))?;
            let old_state_key = WheelAssetStateKey::new(old_asset.state, id)?;
            s.wheel_asset_state_index.remove(&old_state_key);
            let old_asset_type_key = WheelAssetTypeKey::new(&old_asset.asset_type, id)?;
            s.wheel_asset_type_index.remove(&old_asset_type_key);

            asset.update_timestamp();
            s.wheel_assets.insert(id, asset.clone());
            let new_state_key = WheelAssetStateKey::new(asset.state, id)?;
            let new_asset_type_key = WheelAssetTypeKey::new(&asset.asset_type, id)?;

            s.wheel_asset_state_index.insert(new_state_key, id);
            s.wheel_asset_type_index.insert(new_asset_type_key, id);

            match (&old_asset.state, &asset.state) {
                (WheelAssetStateEnum::Enabled, WheelAssetStateEnum::Disabled) => {
                    self.remove_wheel_prize_from_order(&mut s.wheel_prize_index, &id);
                }
                (WheelAssetStateEnum::Disabled, WheelAssetStateEnum::Enabled) => {
                    self.add_wheel_prize_to_order(&mut s.wheel_prize_index, id);
                }
                _ => (),
            }

            Ok(())
        })
    }

    fn delete_wheel_asset(&self, id: &WheelAssetId) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            match s.wheel_assets.remove(id) {
                Some(asset) => {
                    let state_key = WheelAssetStateKey::new(asset.state, *id)?;
                    s.wheel_asset_state_index.remove(&state_key);

                    let asset_type_key = WheelAssetTypeKey::new(&asset.asset_type, *id)?;
                    s.wheel_asset_type_index.remove(&asset_type_key);

                    if asset.is_enabled() {
                        self.remove_wheel_prize_from_order(&mut s.wheel_prize_index, id);
                    }
                }
                None => {
                    return Err(ApiError::not_found(&format!(
                        "Wheel asset with id {} not found",
                        id
                    )))
                }
            }
            Ok(())
        })
    }

    fn list_wheel_assets_by_state(
        &self,
        state: WheelAssetStateEnum,
    ) -> Result<Vec<(WheelAssetId, WheelAsset)>, ApiError> {
        STATE.with_borrow(|s| {
            let range = WheelAssetStateRange::new(state)?;

            Ok(s.wheel_asset_state_index
                .range(range)
                .map(|(_, id)| (id, s.wheel_assets.get(&id).unwrap()))
                .collect())
        })
    }

    fn list_wheel_assets_by_type(
        &self,
        asset_type: &WheelAssetType,
    ) -> Result<Vec<(WheelAssetId, WheelAsset)>, ApiError> {
        STATE.with_borrow(|s| {
            let range = WheelAssetTypeRange::new(asset_type)?;

            Ok(s.wheel_asset_type_index
                .range(range)
                .map(|(_, id)| (id, s.wheel_assets.get(&id).unwrap()))
                .collect())
        })
    }

    fn list_wheel_assets(&self) -> Vec<(WheelAssetId, WheelAsset)> {
        STATE.with_borrow(|s| s.wheel_assets.iter().collect())
    }

    fn get_wheel_prizes_order(&self) -> Vec<WheelAssetId> {
        STATE.with_borrow(|s| s.wheel_prize_index.values().collect())
    }

    fn update_wheel_prizes_order(&self, order: Vec<WheelAssetId>) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            s.wheel_prize_index.clear_new();
            for (i, id) in order.into_iter().enumerate() {
                s.wheel_prize_index.insert(i as u32, id);
            }
            Ok(())
        })
    }
}

impl WheelAssetRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }

    fn add_wheel_prize_to_order(
        &self,
        wheel_prize_index: &mut WheelPrizeOrderMemory,
        id: WheelAssetId,
    ) {
        let new_index = wheel_prize_index
            .last_key_value()
            .map(|(i, _)| i + 1)
            .unwrap_or(0);
        wheel_prize_index.insert(new_index, id);
    }

    fn remove_wheel_prize_from_order(
        &self,
        wheel_prize_index: &mut WheelPrizeOrderMemory,
        id: &WheelAssetId,
    ) {
        for (index, prize_id) in wheel_prize_index.iter() {
            if &prize_id == id {
                wheel_prize_index.remove(&index);
                break;
            }
        }
    }
}

struct WheelAssetState {
    wheel_assets: WheelAssetMemory,
    wheel_asset_state_index: WheelAssetStateIndexMemory,
    wheel_asset_type_index: WheelAssetTypeIndexMemory,
    wheel_prize_index: WheelPrizeOrderMemory,
}

impl Default for WheelAssetState {
    fn default() -> Self {
        Self {
            wheel_assets: init_wheel_assets(),
            wheel_asset_state_index: init_wheel_asset_state_index(),
            wheel_asset_type_index: init_wheel_asset_type_index(),
            wheel_prize_index: init_wheel_prize_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<WheelAssetState> = RefCell::new(WheelAssetState::default());
}
