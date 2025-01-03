use std::cell::RefCell;

use backend_api::ApiError;

use super::{
    init_wheel_asset_state_index, init_wheel_asset_type_index, init_wheel_assets, Timestamped,
    WheelAsset, WheelAssetId, WheelAssetMemory, WheelAssetState as WheelAssetStateEnum,
    WheelAssetStateIndexMemory, WheelAssetStateKey, WheelAssetStateRange, WheelAssetType,
    WheelAssetTypeIndexMemory, WheelAssetTypeKey, WheelAssetTypeRange,
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
            s.wheel_assets.insert(id, asset);
            s.wheel_asset_state_index.insert(state_key, id);
            s.wheel_asset_type_index.insert(asset_type_key, id);
        });

        Ok(id)
    }

    fn update_wheel_asset(&self, id: WheelAssetId, mut asset: WheelAsset) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            asset.update_timestamp();
            s.wheel_assets.insert(id, asset);

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
}

impl WheelAssetRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct WheelAssetState {
    wheel_assets: WheelAssetMemory,
    wheel_asset_state_index: WheelAssetStateIndexMemory,
    wheel_asset_type_index: WheelAssetTypeIndexMemory,
}

impl Default for WheelAssetState {
    fn default() -> Self {
        Self {
            wheel_assets: init_wheel_assets(),
            wheel_asset_state_index: init_wheel_asset_state_index(),
            wheel_asset_type_index: init_wheel_asset_type_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<WheelAssetState> = RefCell::new(WheelAssetState::default());
}
