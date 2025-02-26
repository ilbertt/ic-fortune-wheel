use backend_api::ApiError;
use candid::{
    types::{Type, TypeInner},
    CandidType, Deserialize,
};
use chrono::{Datelike, Timelike};
use ic_stable_structures::{storable::Bound, Storable};
use std::{borrow::Cow, fmt::Display, str::FromStr};

use crate::system_api::get_date_time;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct DateTime(chrono::DateTime<chrono::Utc>);

const DATE_TIME_SIZE: u32 = 25;

impl DateTime {
    pub fn new(date_time: chrono::DateTime<chrono::Utc>) -> Result<Self, ApiError> {
        Ok(Self(date_time.with_nanosecond(0).ok_or(
            ApiError::internal(&format!("Failed to convert date time {:?}", date_time)),
        )?))
    }

    pub fn from_timestamp_micros(micros: u64) -> Result<Self, ApiError> {
        let micros = micros.try_into().map_err(|err| {
            ApiError::internal(&format!(
                "Failed to convert timestamp {} to micros: {}",
                micros, err
            ))
        })?;
        let dt = chrono::DateTime::from_timestamp_micros(micros).ok_or(ApiError::internal(
            &format!("Failed to convert timestamp {} to date time", micros),
        ))?;
        Self::new(dt)
    }

    pub fn sub(&self, duration: chrono::Duration) -> Self {
        Self(self.0 - duration)
    }

    pub fn min() -> Self {
        Self(chrono::DateTime::<chrono::Utc>::UNIX_EPOCH)
    }

    pub fn max() -> Result<Self, ApiError> {
        Ok(Self(
            chrono::DateTime::<chrono::Utc>::MAX_UTC
                .with_year(9999)
                .ok_or_else(|| ApiError::internal("Failed to create max date time."))?,
        ))
    }

    pub fn timestamp_nanos(&self) -> u64 {
        self.0
            .timestamp_nanos_opt()
            .unwrap_or(0)
            .try_into()
            .unwrap()
    }

    pub fn timestamp_micros(&self) -> u64 {
        self.0.timestamp_micros().try_into().unwrap()
    }

    pub fn timestamp_seconds(&self) -> u64 {
        self.0.timestamp().try_into().unwrap()
    }
}

impl Display for DateTime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0.to_rfc3339_opts(chrono::SecondsFormat::Secs, false))
    }
}

impl CandidType for DateTime {
    fn _ty() -> Type {
        TypeInner::Text.into()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: candid::types::Serializer,
    {
        self.to_string().idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for DateTime {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        String::deserialize(deserializer)
            .and_then(|date_time| {
                chrono::DateTime::parse_from_rfc3339(&date_time)
                    .map_err(|_| serde::de::Error::custom("Invalid date time."))
            })
            .map(|date_time| Self(date_time.into()))
    }
}

impl Storable for DateTime {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(self.to_string().as_bytes().to_vec())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(chrono::DateTime::from_str(core::str::from_utf8(&bytes).unwrap()).unwrap())
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: DATE_TIME_SIZE,
        is_fixed_size: true,
    };
}

pub fn get_current_date_time() -> DateTime {
    // we can be confident to unwrap here as timestamp is always available
    get_date_time().and_then(DateTime::new).unwrap()
}

pub fn elapsed_since(timestamp_ns: &DateTime) -> std::time::Duration {
    std::time::Duration::from_nanos(ic_cdk::api::time() - timestamp_ns.timestamp_nanos())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case(fixtures::date_time_a())]
    #[case(fixtures::date_time_b())]
    #[case(fixtures::date_time_c())]
    fn storable_impl_admin(#[case] date_time: DateTime) {
        let serialized_date_time = date_time.to_bytes();
        let deserialized_date_time = DateTime::from_bytes(serialized_date_time);

        assert_eq!(date_time, deserialized_date_time);
    }

    #[rstest]
    fn date_time_timestamp() {
        let (timestamp, date_string) = timestamp_micros();
        let date_time = DateTime::from_timestamp_micros(timestamp).unwrap();

        assert_eq!(date_time.to_string(), date_string);
        assert_eq!(date_time.timestamp_micros(), timestamp);
    }

    #[fixture]
    fn timestamp_micros() -> (u64, String) {
        (1706899350000000, "2024-02-02T18:42:30+00:00".to_string())
    }
}
