use backend_api::ApiError;

use crate::repositories::{HttpAssetRepository, HttpAssetRepositoryImpl};

#[cfg_attr(test, mockall::automock)]
pub trait HttpAssetService {
    fn init(&self) -> Result<(), ApiError>;
}

pub struct HttpAssetServiceImpl<H: HttpAssetRepository> {
    http_asset_repository: H,
}

impl Default for HttpAssetServiceImpl<HttpAssetRepositoryImpl> {
    fn default() -> Self {
        Self::new(HttpAssetRepositoryImpl::default())
    }
}

impl<H: HttpAssetRepository> HttpAssetService for HttpAssetServiceImpl<H> {
    fn init(&self) -> Result<(), ApiError> {
        self.http_asset_repository.certify_all_assets()
    }
}

impl<H: HttpAssetRepository> HttpAssetServiceImpl<H> {
    pub fn new(http_asset_repository: H) -> Self {
        Self {
            http_asset_repository,
        }
    }
}
