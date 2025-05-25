use std::cell::RefCell;

use backend_api::ApiError;

use super::{
    init_custom_domain_records, CustomDomainRecord, CustomDomainRecordId, CustomDomainRecordMemory,
    Timestamped,
};

#[cfg_attr(test, mockall::automock)]
pub trait CustomDomainRecordRepository {
    fn get_custom_domain_record(&self, id: &CustomDomainRecordId) -> Option<CustomDomainRecord>;

    fn get_custom_domain_record_count(&self) -> u64;

    fn create_custom_domain_record(
        &self,
        custom_domain_record: CustomDomainRecord,
    ) -> Result<CustomDomainRecordId, ApiError>;

    fn update_custom_domain_record(
        &self,
        id: CustomDomainRecordId,
        custom_domain_record: CustomDomainRecord,
    ) -> Result<(), ApiError>;

    fn delete_custom_domain_record(&self, id: CustomDomainRecordId) -> Result<(), ApiError>;

    fn list_custom_domain_records(
        &self,
    ) -> Result<Vec<(CustomDomainRecordId, CustomDomainRecord)>, ApiError>;
}

pub struct CustomDomainRecordRepositoryImpl {}

impl Default for CustomDomainRecordRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl CustomDomainRecordRepository for CustomDomainRecordRepositoryImpl {
    fn get_custom_domain_record(&self, id: &CustomDomainRecordId) -> Option<CustomDomainRecord> {
        STATE.with_borrow(|s| s.custom_domain_records.get(id))
    }

    fn get_custom_domain_record_count(&self) -> u64 {
        STATE.with_borrow(|s| s.custom_domain_records.len())
    }

    fn create_custom_domain_record(
        &self,
        custom_domain_record: CustomDomainRecord,
    ) -> Result<CustomDomainRecordId, ApiError> {
        let id = CustomDomainRecordId::new();

        STATE.with_borrow_mut(|s| {
            s.custom_domain_records.insert(id, custom_domain_record);

            Ok(id)
        })
    }

    fn update_custom_domain_record(
        &self,
        id: CustomDomainRecordId,
        mut custom_domain_record: CustomDomainRecord,
    ) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            custom_domain_record.update_timestamp();

            s.custom_domain_records.insert(id, custom_domain_record);

            Ok(())
        })
    }

    fn delete_custom_domain_record(&self, id: CustomDomainRecordId) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            s.custom_domain_records
                .remove(&id)
                .map(|_| ())
                .ok_or_else(|| {
                    ApiError::not_found(&format!("Custom domain record with id {} not found", id))
                })
        })
    }

    fn list_custom_domain_records(
        &self,
    ) -> Result<Vec<(CustomDomainRecordId, CustomDomainRecord)>, ApiError> {
        STATE.with_borrow(|s| Ok(s.custom_domain_records.iter().collect()))
    }
}

impl CustomDomainRecordRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct CustomDomainRecordState {
    custom_domain_records: CustomDomainRecordMemory,
}

impl Default for CustomDomainRecordState {
    fn default() -> Self {
        Self {
            custom_domain_records: init_custom_domain_records(),
        }
    }
}

thread_local! {
    static STATE: RefCell<CustomDomainRecordState> = RefCell::new(CustomDomainRecordState::default());
}
