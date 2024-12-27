use ic_cdk::query;
use ic_http_certification::{HttpRequest, HttpResponse};

use crate::{
    repositories::HttpAssetRepositoryImpl,
    services::{HttpAssetService, HttpAssetServiceImpl},
};

#[query]
fn http_request(req: HttpRequest<'static>) -> HttpResponse<'static> {
    HttpController::default().http_request(&req)
}

struct HttpController<H: HttpAssetService> {
    http_asset_service: H,
}

impl Default for HttpController<HttpAssetServiceImpl<HttpAssetRepositoryImpl>> {
    fn default() -> Self {
        Self::new(HttpAssetServiceImpl::default())
    }
}

impl<H: HttpAssetService> HttpController<H> {
    pub fn new(http_asset_service: H) -> Self {
        Self { http_asset_service }
    }

    fn http_request(&self, req: &HttpRequest<'static>) -> HttpResponse<'static> {
        self.http_asset_service.serve_assets(req)
    }
}
