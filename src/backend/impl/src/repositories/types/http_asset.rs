use std::{
    borrow::Cow,
    fmt::Display,
    path::{Path, PathBuf},
};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_asset_certification::{Asset, AssetConfig, AssetEncoding};
use ic_http_certification::HeaderField;
use ic_stable_structures::{storable::Bound, Storable};

use super::{TimestampFields, Timestamped, Uuid};

/// 1 week public cache
const ONE_HOUR_CACHE_CONTROL: &str = "public, max-age=604800, immutable";

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct HttpAssetPath(pub PathBuf);

impl HttpAssetPath {
    pub fn new(path: PathBuf) -> Self {
        Self(path)
    }

    pub fn as_path_buf(&self) -> &PathBuf {
        &self.0
    }
}

impl Display for HttpAssetPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0.to_string_lossy())
    }
}

impl Storable for HttpAssetPath {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self.as_path_buf()).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        let path = Decode!(bytes.as_ref(), PathBuf).unwrap();
        Self::new(path)
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct HttpAsset {
    pub content_type: String,
    pub content_bytes: Vec<u8>,
    pub timestamps: TimestampFields,
}

impl HttpAsset {
    /// Creates a new HttpAsset, returning the new path composed by parent_path and a new uuid.
    pub async fn new_at_path(
        parent_path: &Path,
        content_type: String,
        content_bytes: Vec<u8>,
    ) -> Result<(HttpAssetPath, Self), ApiError> {
        let path = parent_path.join(Uuid::new().await?.to_string());
        let timestamps = TimestampFields::new();
        let http_asset = HttpAsset {
            content_type,
            content_bytes,
            timestamps,
        };
        Ok((HttpAssetPath::new(path), http_asset))
    }

    pub fn to_asset_with_config<'a>(
        &self,
        path: &'a HttpAssetPath,
    ) -> (Asset<'_, 'a>, AssetConfig) {
        let path = path.as_path_buf().as_os_str().to_str().unwrap();
        let asset = Asset::new(path, self.content_bytes.clone());
        let asset_config = AssetConfig::File {
            path: path.to_string(),
            content_type: Some(self.content_type.clone()),
            headers: get_asset_headers(vec![(
                "cache-control".to_string(),
                ONE_HOUR_CACHE_CONTROL.to_string(),
            )]),
            aliased_by: vec![],
            fallback_for: vec![],
            encodings: vec![AssetEncoding::Identity.default_config()],
        };
        (asset, asset_config)
    }
}

impl Timestamped for HttpAsset {
    fn update_timestamp(&mut self) {
        self.timestamps.update();
    }
}

impl Storable for HttpAsset {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
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

#[cfg(test)]
mod tests {
    use super::*;
    use rstest::*;
    use uuid::Uuid;

    #[rstest]
    fn http_asset_storable_impl() {
        let http_asset = HttpAsset {
            content_type: "text/plain".to_string(),
            content_bytes: vec![1, 2, 3],
            timestamps: TimestampFields::new(),
        };
        let serialized_http_asset = http_asset.to_bytes();
        let deserialized_http_asset = HttpAsset::from_bytes(serialized_http_asset);

        assert_eq!(http_asset, deserialized_http_asset);
    }

    #[rstest]
    #[case::root("/")]
    #[case::dir("/test")]
    #[case::dir_with_uuid("/test/de2e65d0-9998-4c34-9493-f1994cb8bca4")]
    #[case::dir_with_subdir("/test/dir")]
    #[case::dir_with_subdir_with_uuid("/test/dir/854c8435-af97-4eb1-b1ae-94146e2e6da8")]
    fn http_asset_path_storable_impl(#[case] path_str: &str) {
        let path = HttpAssetPath(PathBuf::from(path_str));
        let serialized_path = path.to_bytes();
        let deserialized_path = HttpAssetPath::from_bytes(serialized_path);

        assert_eq!(path, deserialized_path);
        assert_eq!(path_str, deserialized_path.to_string());
    }

    #[rstest]
    async fn http_asset_new_at_path() {
        let parent_path = PathBuf::from("/tmp");
        let content_type = "text/plain".to_string();
        let content_bytes = vec![1, 2, 3];

        let (path, http_asset) =
            HttpAsset::new_at_path(&parent_path, content_type.clone(), content_bytes.clone())
                .await
                .unwrap();

        assert_eq!(http_asset.content_type, content_type);
        assert_eq!(http_asset.content_bytes, content_bytes);
        assert!(path.as_path_buf().starts_with("/tmp/"));

        // check that the generated uuid generated is valid and not empty
        let uuid = path.as_path_buf().file_name().unwrap().to_str().unwrap();
        assert_eq!(uuid.len(), 36);
        let parsed_uuid = Uuid::parse_str(uuid).unwrap();
        assert!(!parsed_uuid.is_nil());
    }
}
