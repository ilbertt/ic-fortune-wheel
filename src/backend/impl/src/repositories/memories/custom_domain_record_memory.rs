use ic_stable_structures::BTreeMap;

use crate::repositories::{CustomDomainRecord, CustomDomainRecordId};

use super::{memory_manager::MEMORY_MANAGER, Memory, CUSTOM_DOMAIN_RECORDS_MEMORY_ID};

pub type CustomDomainRecordMemory = BTreeMap<CustomDomainRecordId, CustomDomainRecord, Memory>;

pub fn init_custom_domain_records() -> CustomDomainRecordMemory {
    CustomDomainRecordMemory::init(get_custom_domain_records_memory())
}

fn get_custom_domain_records_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(CUSTOM_DOMAIN_RECORDS_MEMORY_ID))
}
