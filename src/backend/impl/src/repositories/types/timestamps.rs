use std::borrow::Cow;

use candid::{CandidType, Decode, Deserialize, Encode};
use common_types::{get_current_date_time, DateTime};
use ic_stable_structures::{storable::Bound, Storable};

pub trait Timestamped {
    fn update_timestamp(&mut self);
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct TimestampFields {
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

impl TimestampFields {
    pub fn new() -> Self {
        let now = get_current_date_time();
        Self {
            created_at: now,
            updated_at: now,
        }
    }

    pub fn update(&mut self) {
        self.updated_at = get_current_date_time();
    }
}

impl Storable for TimestampFields {
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

    #[rstest]
    fn storable_impl() {
        let timestamps = TimestampFields::new();
        let serialized_user_timestamps = timestamps.to_bytes();
        let deserialized_user_timestamps = TimestampFields::from_bytes(serialized_user_timestamps);

        assert_eq!(timestamps, deserialized_user_timestamps);
    }
}
