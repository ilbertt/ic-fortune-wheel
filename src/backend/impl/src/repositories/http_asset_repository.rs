use std::cell::RefCell;

use backend_api::ApiError;
use ic_asset_certification::AssetRouter;
use ic_asset_certification::{Asset, AssetConfig, AssetEncoding};
use ic_cdk::api::{data_certificate, set_certified_data};
use ic_http_certification::{HeaderField, HttpRequest, HttpResponse};

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
            // To avoid conflicts, we delete all assets before re-certifying them.
            s.router.delete_all_assets();

            // First, we certify the static assets, so that if there are dynamic assets with the same path,
            // the static assets will be overridden.
            static_assets::certify_all_assets(&mut s.router);

            for (path, item) in s.http_assets.iter() {
                let path = path.into_path_buf().to_string_lossy().to_string();
                let asset = Asset::new(path.clone(), item.content_bytes);
                let asset_config = AssetConfig::File {
                    path,
                    content_type: Some(item.content_type),
                    headers: get_asset_headers(item.headers),
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
        ("content-security-policy".to_string(), "default-src 'self';script-src 'self' 'unsafe-inline' 'unsafe-eval';connect-src 'self' http://localhost:* https://icp0.io https://*.icp0.io https://icp-api.io https://fastly.jsdelivr.net;img-src 'self' https://*.icp0.io data: blob:;style-src * 'unsafe-inline';style-src-elem * 'unsafe-inline';font-src *;object-src 'none';media-src 'self' data:;base-uri 'self';frame-ancestors 'none';form-action 'self';upgrade-insecure-requests".to_string()),
        ("referrer-policy".to_string(), "same-origin".to_string()),
        ("permissions-policy".to_string(), "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(self), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(self), gamepad=(), speaker-selection=(), conversion-measurement=(), focus-without-user-activation=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), sync-script=(), trust-token-redemption=(), window-placement=(), vertical-scroll=()".to_string()),
        ("x-xss-protection".to_string(), "1; mode=block".to_string()),
    ];
    headers.extend(additional_headers);

    headers
}

thread_local! {
    static STATE: RefCell<HttpAssetState<'static>> = RefCell::new(HttpAssetState::default());
}

pub mod static_assets {
    use std::path::{Path, PathBuf};

    use backend_api::ApiError;
    use ic_asset_certification::{
        Asset, AssetConfig, AssetEncoding, AssetFallbackConfig, AssetRouter,
    };
    use ic_http_certification::{HeaderField, StatusCode};
    use include_dir::Dir;

    use crate::repositories::{
        HttpAsset, HttpAssetPath, ACCESS_CONTROL_ALLOW_ORIGIN_HEADER_NAME,
        CACHE_CONTROL_HEADER_NAME,
    };

    fn collect_assets<'content, 'path>(
        dir: &'content Dir<'path>,
        assets: &mut Vec<Asset<'content, 'path>>,
    ) {
        for file in dir.files() {
            let file_path = file.path();
            if file_path.ends_with(".gitkeep") {
                // do not expose .gitkeep files
                continue;
            }
            assets.push(Asset::new(file_path.to_string_lossy(), file.contents()));
        }

        for dir in dir.dirs() {
            collect_assets(dir, assets);
        }
    }

    const IMMUTABLE_ASSET_CACHE_CONTROL: &str = "public, max-age=31536000, immutable";
    const NO_CACHE_ASSET_CACHE_CONTROL: &str = "public, no-cache, no-store";

    const WELL_KNOWN_PATH: &str = "/.well-known";
    const IC_DOMAINS_FILE_NAME: &str = "ic-domains";
    const II_ALTERNATIVE_ORIGINS_FILE_NAME: &str = "ii-alternative-origins";

    const CONTENT_TYPE_TEXT_PLAIN: &str = "text/plain";
    const CONTENT_TYPE_APPLICATION_JSON: &str = "application/json";

    pub(super) fn certify_all_assets(asset_router: &mut AssetRouter<'static>) {
        // 1. Define the asset certification configurations.
        let encodings = vec![
            AssetEncoding::Brotli.default_config(),
            AssetEncoding::Gzip.default_config(),
        ];

        let canister_id_cookie_header: HeaderField = (
            "set-cookie".to_string(),
            // can be a session cookie, as we set it on every request
            format!("canisterId={}", ic_cdk::id().to_text()),
        );

        let asset_configs = vec![
            AssetConfig::File {
                path: "index.html".to_string(),
                content_type: Some("text/html".to_string()),
                headers: super::get_asset_headers(vec![
                    (
                        CACHE_CONTROL_HEADER_NAME.to_string(),
                        NO_CACHE_ASSET_CACHE_CONTROL.to_string(),
                    ),
                    canister_id_cookie_header.clone(),
                ]),
                fallback_for: vec![AssetFallbackConfig {
                    scope: "/".to_string(),
                    status_code: Some(StatusCode::OK),
                }],
                aliased_by: vec!["/".to_string()],
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.js".to_string(),
                content_type: Some("text/javascript".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.css".to_string(),
                content_type: Some("text/css".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.png".to_string(),
                content_type: Some("image/png".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.svg".to_string(),
                content_type: Some("image/svg+xml".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: encodings.clone(),
            },
            AssetConfig::Pattern {
                pattern: "**/*.txt".to_string(),
                content_type: Some("text/plain".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings,
            },
            AssetConfig::Pattern {
                pattern: "**/*.ico".to_string(),
                content_type: Some("image/x-icon".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: vec![],
            },
            AssetConfig::Pattern {
                pattern: "**/*.otf".to_string(),
                content_type: Some("application/x-font-opentype".to_string()),
                headers: super::get_asset_headers(vec![(
                    CACHE_CONTROL_HEADER_NAME.to_string(),
                    IMMUTABLE_ASSET_CACHE_CONTROL.to_string(),
                )]),
                encodings: vec![],
            },
            AssetConfig::Pattern {
                pattern: format!("{WELL_KNOWN_PATH}/*"),
                content_type: None,
                headers: well_known_asset_headers(),
                encodings: vec![],
            },
            AssetConfig::File {
                path: format!("{WELL_KNOWN_PATH}/{II_ALTERNATIVE_ORIGINS_FILE_NAME}"),
                content_type: Some("application/json".to_string()),
                headers: well_known_asset_headers(),
                fallback_for: vec![],
                aliased_by: vec![],
                encodings: vec![],
            },
        ];

        // 2. Collect all assets from the frontend build directory.
        let mut assets = Vec::new();
        collect_assets(&crate::FRONTEND_ASSETS_DIR, &mut assets);

        if let Err(err) = asset_router.certify_assets(assets, asset_configs) {
            ic_cdk::trap(&format!("Failed to certify assets: {}", err));
        }
    }

    fn well_known_asset_headers() -> Vec<HeaderField> {
        super::get_asset_headers(vec![
            (
                CACHE_CONTROL_HEADER_NAME.to_string(),
                NO_CACHE_ASSET_CACHE_CONTROL.to_string(),
            ),
            (
                ACCESS_CONTROL_ALLOW_ORIGIN_HEADER_NAME.to_string(),
                "*".to_string(),
            ),
        ])
    }

    pub fn well_known_ic_domains_path() -> HttpAssetPath {
        HttpAssetPath::new(PathBuf::from(WELL_KNOWN_PATH).join(IC_DOMAINS_FILE_NAME))
    }

    pub fn well_known_ii_alternative_origins_path() -> HttpAssetPath {
        HttpAssetPath::new(PathBuf::from(WELL_KNOWN_PATH).join(II_ALTERNATIVE_ORIGINS_FILE_NAME))
    }

    pub fn create_well_known_ic_domains_file(
        domain_name: &str,
    ) -> Result<(HttpAssetPath, HttpAsset), ApiError> {
        let ic_domains_content = format!("{domain_name}\n");

        HttpAsset::new_at_path(
            Path::new(WELL_KNOWN_PATH),
            CONTENT_TYPE_TEXT_PLAIN.to_string(),
            ic_domains_content.as_bytes().to_vec(),
            well_known_asset_headers(),
            Some(IC_DOMAINS_FILE_NAME.to_string()),
        )
    }

    pub fn create_well_known_ii_alternative_origins_file(
        domain_name: &str,
    ) -> Result<(HttpAssetPath, HttpAsset), ApiError> {
        let ii_alternative_origins_content =
            format!("{{\"alternativeOrigins\": [\"https://{}\"]}}", domain_name);

        HttpAsset::new_at_path(
            Path::new(WELL_KNOWN_PATH),
            CONTENT_TYPE_APPLICATION_JSON.to_string(),
            ii_alternative_origins_content.as_bytes().to_vec(),
            well_known_asset_headers(),
            Some(II_ALTERNATIVE_ORIGINS_FILE_NAME.to_string()),
        )
    }
}
