use backend_api::ApiError;
use ic_http_certification::{HttpRequest, HttpResponse};

use crate::repositories::{HttpAssetRepository, HttpAssetRepositoryImpl};

#[cfg_attr(test, mockall::automock)]
pub trait HttpAssetService {
    fn init(&self) -> Result<(), ApiError>;

    fn serve_assets(&self, request: &HttpRequest<'static>) -> HttpResponse<'static>;
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

    fn serve_assets(&self, request: &HttpRequest<'static>) -> HttpResponse<'static> {
        self.http_asset_repository.serve_assets(request)
    }
}

impl<H: HttpAssetRepository> HttpAssetServiceImpl<H> {
    pub fn new(http_asset_repository: H) -> Self {
        Self {
            http_asset_repository,
        }
    }
}
