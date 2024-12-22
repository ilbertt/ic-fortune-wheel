use backend_api::{ApiError, ListWheelAssetsRequest, ListWheelAssetsResponse};

use crate::{
    mappings::map_wheel_asset,
    repositories::{
        ckbtc_wheel_asset, cketh_wheel_asset, ckusdc_wheel_asset, icp_wheel_asset,
        WheelAssetRepository, WheelAssetRepositoryImpl,
    },
};

#[cfg_attr(test, mockall::automock)]
pub trait WheelAssetService {
    fn list_wheel_assets(
        &self,
        request: ListWheelAssetsRequest,
    ) -> Result<ListWheelAssetsResponse, ApiError>;

    async fn set_default_wheel_assets(&self) -> Result<(), ApiError>;
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

    async fn set_default_wheel_assets(&self) -> Result<(), ApiError> {
        let existing_assets_count = self.wheel_asset_repository.list_wheel_assets(None)?.len();

        if existing_assets_count > 0 {
            return Err(ApiError::conflict("Wheel assets already exist"));
        }

        for asset in [
            icp_wheel_asset(),
            ckbtc_wheel_asset(),
            cketh_wheel_asset(),
            ckusdc_wheel_asset(),
        ] {
            self.wheel_asset_repository
                .create_wheel_asset(asset)
                .await?;
        }

        Ok(())
    }
}

impl<W: WheelAssetRepository> WheelAssetServiceImpl<W> {
    fn new(wheel_asset_repository: W) -> Self {
        Self {
            wheel_asset_repository,
        }
    }
}
