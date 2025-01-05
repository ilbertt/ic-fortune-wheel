use std::cell::RefCell;

use backend_api::ApiError;
use ic_asset_certification::AssetRouter;
use ic_cdk::api::{data_certificate, set_certified_data};
use ic_http_certification::{HttpRequest, HttpResponse};

use super::{init_http_assets, HttpAsset, HttpAssetMemory, HttpAssetPath};

#[cfg_attr(test, mockall::automock)]
pub trait HttpAssetRepository {
    fn certify_all_assets(&self) -> Result<(), ApiError>;

    fn create_http_asset(&self, path: HttpAssetPath, http_asset: HttpAsset)
        -> Result<(), ApiError>;

    fn delete_http_asset(&self, path: &HttpAssetPath) -> Result<(), ApiError>;

    fn serve_assets(&self, request: &HttpRequest<'static>) -> HttpResponse<'static>;
}

pub struct HttpAssetRepositoryImpl {}

impl Default for HttpAssetRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl HttpAssetRepository for HttpAssetRepositoryImpl {
    fn certify_all_assets(&self) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            // To avoid memory leaks, we delete all assets before re-certifying them.
            s.router.delete_all_assets();

            let assets_iter = {
                // We need to create a static reference to the asset. By creating a Box we
                // can use the Box::leak function to create a static reference.
                //
                // SAFETY: this is safe because the reference returned from Box::leak is never dropped
                // until we certify the assets again and replace them with new ones.
                let v = s.http_assets.iter().collect::<Vec<_>>().into_boxed_slice();
                Box::leak(v)
            }
            .iter()
            .map(|(path, item)| item.to_asset_with_config(path));

            for (asset, asset_config) in assets_iter {
                s.router
                    .certify_assets(vec![asset], vec![asset_config])
                    .map_err(|e| ApiError::internal(&e.to_string()))?;
            }

            set_certified_data(&s.router.root_hash());

            Ok(())
        })
    }

    /// You must call the `certify_all_assets` method **after** calling this method,
    /// in order to update the assets router and certification.
    fn create_http_asset(
        &self,
        path: HttpAssetPath,
        http_asset: HttpAsset,
    ) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            s.http_assets.insert(path, http_asset);

            Ok(())
        })
    }

    /// You must call the `certify_all_assets` method **after** calling this method,
    /// in order to update the assets router and certification.
    fn delete_http_asset(&self, path: &HttpAssetPath) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            s.http_assets.remove(path);

            Ok(())
        })
    }

    fn serve_assets(&self, request: &HttpRequest<'static>) -> HttpResponse<'static> {
        STATE.with_borrow(|s| {
            let data_certificate = data_certificate().expect("Failed to get data certificate");
            s.router
                .serve_asset(&data_certificate, request)
                .expect("Failed to serve asset")
        })
    }
}

impl HttpAssetRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct HttpAssetState<'a> {
    http_assets: HttpAssetMemory,
    router: AssetRouter<'a>,
}

impl Default for HttpAssetState<'_> {
    fn default() -> Self {
        Self {
            http_assets: init_http_assets(),
            router: AssetRouter::default(),
        }
    }
}

thread_local! {
    static STATE: RefCell<HttpAssetState<'static>> = RefCell::new(HttpAssetState::default());
}
