use super::{TimestampFields, Timestamped, Uuid};
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};
use std::borrow::Cow;

pub type UserId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct UserProfile {
    pub username: String,
    pub timestamps: TimestampFields,
}

impl Timestamped for UserProfile {
    fn new() -> Self {
        Self {
            username: "member".to_string(),
            timestamps: TimestampFields::new(),
        }
    }

    fn update_timestamp(&mut self) {
        self.timestamps.update();
    }
}

impl Storable for UserProfile {
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
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    fn storable_impl() {
        let profile = fixtures::user_profile();
        let serialized_user_profile = profile.to_bytes();
        let deserialized_user_profile = UserProfile::from_bytes(serialized_user_profile);

        assert_eq!(profile, deserialized_user_profile);
    }
}