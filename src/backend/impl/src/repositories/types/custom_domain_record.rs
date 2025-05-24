use std::borrow::Cow;

use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::{storable::Bound, Storable};

use super::{TimestampFields, Timestamped, Uuid};

pub type CustomDomainRecordId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum CustomDomainRecordBnRegistrationState {
    NotStarted,
    Pending {
        bn_registration_id: String,
    },
    Registered {
        bn_registration_id: String,
    },
    Failed {
        bn_registration_id: String,
        error_message: String,
    },
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct CustomDomainRecord {
    pub domain_name: String,
    pub bn_registration_state: CustomDomainRecordBnRegistrationState,
    pub timestamps: TimestampFields,
}

impl Timestamped for CustomDomainRecord {
    fn update_timestamp(&mut self) {
        self.timestamps.update();
    }
}

impl Storable for CustomDomainRecord {
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
    #[case::not_started(fixtures::custom_domain_record_not_started())]
    #[case::pending(fixtures::custom_domain_record_pending())]
    #[case::registered(fixtures::custom_domain_record_registered())]
    #[case::failed(fixtures::custom_domain_record_failed())]
    fn storable_impl(#[case] custom_domain_record: CustomDomainRecord) {
        let serialized_custom_domain_record = custom_domain_record.to_bytes();
        let deserialized_custom_domain_record =
            CustomDomainRecord::from_bytes(serialized_custom_domain_record);

        assert_eq!(custom_domain_record, deserialized_custom_domain_record);
    }
}
