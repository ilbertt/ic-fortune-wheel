use backend_api::{
    ApiError, ApiResult, CreateCustomDomainRecordRequest, CreateCustomDomainRecordResponse,
    DeleteCustomDomainRecordRequest, ListCustomDomainRecordsResponse,
    UpdateCustomDomainRecordRequest,
};
use backend_macros::log_errors;
use candid::Principal;
use ic_cdk::{caller, query, update};

use crate::{
    repositories::{
        CustomDomainRecordRepositoryImpl, HttpAssetRepositoryImpl, UserProfileRepositoryImpl,
    },
    services::{
        AccessControlService, AccessControlServiceImpl, CustomDomainRecordService,
        CustomDomainRecordServiceImpl,
    },
};

#[update]
#[log_errors]
fn create_custom_domain_record(
    request: CreateCustomDomainRecordRequest,
) -> ApiResult<CreateCustomDomainRecordResponse> {
    let calling_principal = caller();

    CustomDomainRecordController::default()
        .create_custom_domain_record(calling_principal, request)
        .into()
}

#[update]
#[log_errors]
fn update_custom_domain_record(request: UpdateCustomDomainRecordRequest) -> ApiResult<()> {
    let calling_principal = caller();

    CustomDomainRecordController::default()
        .update_custom_domain_record(calling_principal, request)
        .into()
}

#[update]
#[log_errors]
fn delete_custom_domain_record(request: DeleteCustomDomainRecordRequest) -> ApiResult<()> {
    let calling_principal = caller();

    CustomDomainRecordController::default()
        .delete_custom_domain_record(calling_principal, request)
        .into()
}

#[query]
#[log_errors]
fn list_custom_domain_records() -> ApiResult<ListCustomDomainRecordsResponse> {
    let calling_principal = caller();

    CustomDomainRecordController::default()
        .list_custom_domain_records(calling_principal)
        .into()
}

pub struct CustomDomainRecordController<A: AccessControlService, C: CustomDomainRecordService> {
    access_control_service: A,
    custom_domain_record_service: C,
}

impl Default
    for CustomDomainRecordController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        CustomDomainRecordServiceImpl<CustomDomainRecordRepositoryImpl, HttpAssetRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self {
            access_control_service: AccessControlServiceImpl::default(),
            custom_domain_record_service: CustomDomainRecordServiceImpl::default(),
        }
    }
}

impl<A: AccessControlService, C: CustomDomainRecordService> CustomDomainRecordController<A, C> {
    fn create_custom_domain_record(
        &self,
        calling_principal: Principal,
        request: CreateCustomDomainRecordRequest,
    ) -> Result<CreateCustomDomainRecordResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.custom_domain_record_service
            .create_custom_domain_record(request)
    }

    fn update_custom_domain_record(
        &self,
        calling_principal: Principal,
        request: UpdateCustomDomainRecordRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.custom_domain_record_service
            .update_custom_domain_record(request)
    }

    fn delete_custom_domain_record(
        &self,
        calling_principal: Principal,
        request: DeleteCustomDomainRecordRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.custom_domain_record_service
            .delete_custom_domain_record(request)
    }

    fn list_custom_domain_records(
        &self,
        calling_principal: Principal,
    ) -> Result<ListCustomDomainRecordsResponse, ApiError> {
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.custom_domain_record_service
            .list_custom_domain_records()
    }
}
