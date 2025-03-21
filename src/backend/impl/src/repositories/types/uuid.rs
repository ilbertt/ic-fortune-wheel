use backend_api::ApiError;
use candid::{
    types::{Serializer, Type, TypeInner},
    CandidType, Deserialize,
};
use ic_stable_structures::{storable::Bound, Storable};
use std::{borrow::Cow, fmt::Display};
use uuid::{Builder, Uuid as UuidImpl};

use crate::system_api::{get_unix_timestamp_millis, with_random_bytes};

const UUID_BYTES_SIZE: usize = 16;
const UUID_RNG_SIZE: usize = 10;

#[derive(Debug, Clone, Copy, Default, Ord, PartialOrd, PartialEq, Eq)]
/// A UUID v7, see https://www.ietf.org/rfc/rfc9562.html#name-uuid-version-7
pub struct Uuid(UuidImpl);

impl Uuid {
    pub fn new() -> Self {
        with_random_bytes(|bytes: [u8; UUID_RNG_SIZE]| Self::from_random_bytes(bytes))
    }

    pub fn from_random_bytes(bytes: [u8; UUID_RNG_SIZE]) -> Self {
        let timestamp_millis = get_unix_timestamp_millis();
        Self(Builder::from_unix_timestamp_millis(timestamp_millis, &bytes).into_uuid())
    }

    pub fn max() -> Self {
        Self(UuidImpl::max())
    }

    pub fn min() -> Self {
        Self::nil()
    }

    pub fn nil() -> Self {
        Self(UuidImpl::nil())
    }
}

impl TryFrom<&str> for Uuid {
    type Error = ApiError;

    fn try_from(uuid: &str) -> Result<Uuid, Self::Error> {
        let uuid = UuidImpl::parse_str(uuid).map_err(|_| {
            ApiError::internal(&format!("Failed to parse UUID from string: {}", uuid))
        })?;

        Ok(Self(uuid))
    }
}

impl Display for Uuid {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0.to_string())
    }
}

impl CandidType for Uuid {
    fn _ty() -> Type {
        TypeInner::Text.into()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: Serializer,
    {
        self.to_string().idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Uuid {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        String::deserialize(deserializer).and_then(|uuid| {
            Uuid::try_from(uuid.as_str()).map_err(|_| serde::de::Error::custom("Invalid UUID."))
        })
    }
}

impl Storable for Uuid {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Borrowed(self.0.as_bytes())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(UuidImpl::from_bytes(bytes.into_owned().try_into().unwrap()))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: UUID_BYTES_SIZE as u32,
        is_fixed_size: true,
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    fn storable_impl() {
        let uuid = fixtures::uuid();

        let serialized_uuid = uuid.to_bytes();
        let deserialized_uuid = Uuid::from_bytes(serialized_uuid);

        assert_eq!(deserialized_uuid, uuid);
    }

    #[rstest]
    fn try_from() {
        let uuid = fixtures::uuid();

        let result = Uuid::try_from(uuid.to_string().as_str()).unwrap();

        assert_eq!(result, uuid);
    }

    #[rstest]
    fn try_from_invalid_uuid() {
        let uuid_string = "not a uuid";

        let result = Uuid::try_from(uuid_string).unwrap_err();

        assert_eq!(
            result,
            ApiError::internal(&format!(
                "Failed to parse UUID from string: {}",
                uuid_string
            ))
        );
    }
}
