use crate::repositories::{
    CustomDomainRecord, CustomDomainRecordBnRegistrationState, CustomDomainRecordId,
};

impl From<CustomDomainRecordBnRegistrationState>
    for backend_api::CustomDomainRecordBnRegistrationState
{
    fn from(value: CustomDomainRecordBnRegistrationState) -> Self {
        match value {
            CustomDomainRecordBnRegistrationState::NotStarted => {
                backend_api::CustomDomainRecordBnRegistrationState::NotStarted
            }
            CustomDomainRecordBnRegistrationState::Pending { bn_registration_id } => {
                backend_api::CustomDomainRecordBnRegistrationState::Pending { bn_registration_id }
            }
            CustomDomainRecordBnRegistrationState::Registered { bn_registration_id } => {
                backend_api::CustomDomainRecordBnRegistrationState::Registered {
                    bn_registration_id,
                }
            }
            CustomDomainRecordBnRegistrationState::Failed {
                bn_registration_id,
                error_message,
            } => backend_api::CustomDomainRecordBnRegistrationState::Failed {
                bn_registration_id,
                error_message,
            },
        }
    }
}

impl From<backend_api::CustomDomainRecordBnRegistrationState>
    for CustomDomainRecordBnRegistrationState
{
    fn from(value: backend_api::CustomDomainRecordBnRegistrationState) -> Self {
        match value {
            backend_api::CustomDomainRecordBnRegistrationState::NotStarted => {
                CustomDomainRecordBnRegistrationState::NotStarted
            }
            backend_api::CustomDomainRecordBnRegistrationState::Pending { bn_registration_id } => {
                CustomDomainRecordBnRegistrationState::Pending { bn_registration_id }
            }
            backend_api::CustomDomainRecordBnRegistrationState::Registered {
                bn_registration_id,
            } => CustomDomainRecordBnRegistrationState::Registered { bn_registration_id },
            backend_api::CustomDomainRecordBnRegistrationState::Failed {
                bn_registration_id,
                error_message,
            } => CustomDomainRecordBnRegistrationState::Failed {
                bn_registration_id,
                error_message,
            },
        }
    }
}

pub fn map_custom_domain_record(
    custom_domain_record_id: CustomDomainRecordId,
    custom_domain_record: CustomDomainRecord,
) -> backend_api::CustomDomainRecord {
    backend_api::CustomDomainRecord {
        id: custom_domain_record_id.to_string(),
        domain_name: custom_domain_record.domain_name,
        bn_registration_state: custom_domain_record.bn_registration_state.into(),
        created_at: custom_domain_record.timestamps.created_at.to_string(),
        updated_at: custom_domain_record.timestamps.updated_at.to_string(),
    }
}
