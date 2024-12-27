use std::cell::RefCell;

use backend_api::ApiError;
use ic_asset_certification::{Asset, AssetConfig, AssetEncoding, AssetRouter};
use ic_cdk::api::set_certified_data;
use ic_http_certification::HeaderField;

use super::{init_http_assets, HttpAsset, HttpAssetMemory, HttpAssetPath};

const ONE_HOUR_CACHE_CONTROL: &str = "public, max-age=86400, immutable";

#[cfg_attr(test, mockall::automock)]
pub trait HttpAssetRepository {
    fn certify_all_assets(&self) -> Result<(), ApiError>;

    fn create_http_asset(&self, path: HttpAssetPath, http_asset: HttpAsset)
        -> Result<(), ApiError>;

    fn delete_http_asset(&self, path: &HttpAssetPath) -> Result<(), ApiError>;
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

            let assets: Vec<Asset<'static, 'static>> = {
                // We need to create a static reference to the asset. By creating a Box we
                // can use the Box::leak function to create a static reference.
                //
                // SAFETY: this is safe because the reference returned from Box::leak is never dropped
                // until we certify the assets again and replace them with new ones.
                let v = s.http_assets.iter().collect::<Vec<_>>().into_boxed_slice();
                Box::leak(v)
            }
            .iter()
            .map(|(path, item)| item.to_asset(path))
            .collect();

            s.router
                .certify_assets(assets, asset_configs())
                .map_err(|e| ApiError::internal(&e.to_string()))?;

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
}

fn asset_configs() -> Vec<AssetConfig> {
    vec![
        AssetConfig::Pattern {
            pattern: "/images/**".to_string(),
            content_type: Some("image/png".to_string()),
            headers: get_asset_headers(vec![(
                "cache-control".to_string(),
                ONE_HOUR_CACHE_CONTROL.to_string(),
            )]),
            encodings: vec![AssetEncoding::Identity.default_config()],
        },
        AssetConfig::Pattern {
            pattern: "/images/**".to_string(),
            content_type: Some("image/svg+xml".to_string()),
            headers: get_asset_headers(vec![(
                "cache-control".to_string(),
                ONE_HOUR_CACHE_CONTROL.to_string(),
            )]),
            encodings: vec![AssetEncoding::Identity.default_config()],
        },
    ]
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
