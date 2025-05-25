use rstest::*;

use crate::repositories::{
    CustomDomainRecord, CustomDomainRecordBnRegistrationState, TimestampFields,
};

#[fixture]
pub fn custom_domain_record_not_started() -> CustomDomainRecord {
    CustomDomainRecord {
        domain_name: "test.com".to_string(),
        bn_registration_state: CustomDomainRecordBnRegistrationState::NotStarted,
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn custom_domain_record_pending() -> CustomDomainRecord {
    CustomDomainRecord {
        domain_name: "test.com".to_string(),
        bn_registration_state: CustomDomainRecordBnRegistrationState::Pending {
            bn_registration_id: "abcdefghijklmnopqrstuvwxyz".to_string(),
        },
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn custom_domain_record_registered() -> CustomDomainRecord {
    CustomDomainRecord {
        domain_name: "test.com".to_string(),
        bn_registration_state: CustomDomainRecordBnRegistrationState::Registered {
            bn_registration_id: "abcdefghijklmnopqrstuvwxyz".to_string(),
        },
        timestamps: TimestampFields::new(),
    }
}

#[fixture]
pub fn custom_domain_record_failed() -> CustomDomainRecord {
    CustomDomainRecord {
        domain_name: "test.com".to_string(),
        bn_registration_state: CustomDomainRecordBnRegistrationState::Failed {
            bn_registration_id: "abcdefghijklmnopqrstuvwxyz".to_string(),
            error_message: "unknown error".to_string(),
        },
        timestamps: TimestampFields::new(),
    }
}
