use std::{
    borrow::Cow,
    fmt::Display,
    path::{Path, PathBuf},
};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};

use super::{TimestampFields, Timestamped, Uuid};

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct HttpAssetPath(pub PathBuf);

impl HttpAssetPath {
    pub fn new(path: PathBuf) -> Self {
        Self(path)
    }

    pub fn as_path_buf(&self) -> &PathBuf {
        &self.0
    }

    pub fn into_path_buf(self) -> PathBuf {
        self.0
    }
}

impl Display for HttpAssetPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_path_buf().to_string_lossy())
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
    pub fn new_at_path(
        parent_path: &Path,
        content_type: String,
        content_bytes: Vec<u8>,
    ) -> Result<(HttpAssetPath, Self), ApiError> {
        let path = parent_path.join(Uuid::new().to_string());
        let timestamps = TimestampFields::new();
        let http_asset = HttpAsset {
            content_type,
            content_bytes,
            timestamps,
        };
        Ok((HttpAssetPath::new(path), http_asset))
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
    #[case::dir_with_uuid("/test/0194e5e6-044b-7e5b-b841-c479037e38e0")]
    #[case::dir_with_subdir("/test/dir")]
    #[case::dir_with_subdir_with_uuid("/test/dir/0194e5e6-689f-7b94-985d-f8570034c626")]
    fn http_asset_path_storable_impl(#[case] path_str: &str) {
        let path = HttpAssetPath(PathBuf::from(path_str));
        let serialized_path = path.to_bytes();
        let deserialized_path = HttpAssetPath::from_bytes(serialized_path);

        assert_eq!(path, deserialized_path);
        assert_eq!(path_str, deserialized_path.to_string());
    }

    #[rstest]
    fn http_asset_new_at_path() {
        let parent_path = PathBuf::from("/tmp");
        let content_type = "text/plain".to_string();
        let content_bytes = vec![1, 2, 3];

        let (path, http_asset) =
            HttpAsset::new_at_path(&parent_path, content_type.clone(), content_bytes.clone())
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
