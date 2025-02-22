use std::cell::RefCell;

use backend_api::ApiError;
use ic_asset_certification::AssetRouter;
use ic_asset_certification::{Asset, AssetConfig, AssetEncoding};
use ic_cdk::api::{data_certificate, set_certified_data};
use ic_http_certification::{HeaderField, HttpRequest, HttpResponse};

use super::{init_http_assets, HttpAsset, HttpAssetMemory, HttpAssetPath};

/// 1 week public cache
const ONE_HOUR_CACHE_CONTROL: &str = "public, max-age=604800, immutable";

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

            for (path, item) in s.http_assets.iter() {
                let path = path.into_path_buf().to_string_lossy().to_string();
                let asset = Asset::new(path.clone(), item.content_bytes.clone());
                let asset_config = AssetConfig::File {
                    path,
                    content_type: Some(item.content_type.clone()),
                    headers: get_asset_headers(vec![(
                        "cache-control".to_string(),
                        ONE_HOUR_CACHE_CONTROL.to_string(),
                    )]),
                    aliased_by: vec![],
                    fallback_for: vec![],
                    encodings: vec![AssetEncoding::Identity.default_config()],
                };

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

fn get_asset_headers(additional_headers: Vec<HeaderField>) -> Vec<HeaderField> {
    // set up the default headers and include additional headers provided by the caller
    let mut headers = vec![
        ("strict-transport-security".to_string(), "max-age=31536000; includeSubDomains".to_string()),
        ("x-frame-options".to_string(), "DENY".to_string()),
        ("x-content-type-options".to_string(), "nosniff".to_string()),
        ("content-security-policy".to_string(), "default-src 'self'; img-src 'self' data:; form-action 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; block-all-mixed-content".to_string()),
        ("referrer-policy".to_string(), "no-referrer".to_string()),
        ("permissions-policy".to_string(), "accelerometer=(),ambient-light-sensor=(),autoplay=(),battery=(),camera=(),display-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),layout-animations=(self),legacy-image-formats=(self),magnetometer=(),microphone=(),midi=(),oversized-images=(self),payment=(),picture-in-picture=(),publickey-credentials-get=(),speaker-selection=(),sync-xhr=(self),unoptimized-images=(self),unsized-media=(self),usb=(),screen-wake-lock=(),web-share=(),xr-spatial-tracking=()".to_string()),
        ("cross-origin-embedder-policy".to_string(), "require-corp".to_string()),
        ("cross-origin-opener-policy".to_string(), "same-origin".to_string()),
    ];
    headers.extend(additional_headers);

    headers
}

thread_local! {
    static STATE: RefCell<HttpAssetState<'static>> = RefCell::new(HttpAssetState::default());
}
