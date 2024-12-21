use backend_api::{ApiError, ListWheelAssetsRequest, ListWheelAssetsResponse};

use crate::{
    mappings::map_wheel_asset,
    repositories::{WheelAssetRepository, WheelAssetRepositoryImpl},
};

#[cfg_attr(test, mockall::automock)]
pub trait WheelAssetService {
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError>;
}

pub struct WheelAssetServiceImpl<W: WheelAssetRepository> {
    wheel_asset_repository: W,
}

impl Default for WheelAssetServiceImpl<WheelAssetRepositoryImpl> {
    fn default() -> Self {
        Self::new(WheelAssetRepositoryImpl::default())
    }
}

impl<W: WheelAssetRepository> WheelAssetService for WheelAssetServiceImpl<W> {
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError> {
        let state = request.state.map(Into::into);

        let items = self
            .wheel_asset_repository
            .list_wheel_assets(state)?
            .into_iter()
            .map(|(id, asset)| map_wheel_asset(id, asset))
            .collect();

        Ok(items)
    }
}

impl<W: WheelAssetRepository> WheelAssetServiceImpl<W> {
    fn new(wheel_asset_repository: W) -> Self {
        Self {
            wheel_asset_repository,
        }
    }
}
