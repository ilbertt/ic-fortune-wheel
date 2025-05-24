use candid::{CandidType, Deserialize};

#[derive(Debug, Clone, CandidType, Deserialize)]
pub enum CustomDomainRecordBnRegistrationState {
    #[serde(rename = "not_started")]
    NotStarted,
    #[serde(rename = "pending")]
    Pending { bn_registration_id: String },
    #[serde(rename = "registered")]
    Registered { bn_registration_id: String },
    #[serde(rename = "failed")]
    Failed {
        bn_registration_id: String,
        error_message: String,
    },
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct CustomDomainRecord {
    pub id: String,
    pub domain_name: String,
    pub bn_registration_state: CustomDomainRecordBnRegistrationState,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct CreateCustomDomainRecordRequest {
    pub domain_name: String,
}

pub type CreateCustomDomainRecordResponse = CustomDomainRecord;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct UpdateCustomDomainRecordRequest {
    pub id: String,
    pub bn_registration_state: CustomDomainRecordBnRegistrationState,
}

pub type ListCustomDomainRecordsResponse = Vec<CustomDomainRecord>;

#[derive(Debug, Clone, CandidType, Deserialize)]
pub struct DeleteCustomDomainRecordRequest {
    pub id: String,
}
