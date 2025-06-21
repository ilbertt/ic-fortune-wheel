use backend_api::{
    ApiError, ApiResult, CreateMyUserProfileResponse, DeleteUserProfileRequest,
    GetMyUserProfileResponse, ListUsersResponse, UpdateMyUserProfileRequest,
    UpdateUserProfileRequest,
};
use backend_macros::log_errors;
use candid::Principal;
use ic_cdk::{api::msg_caller, query, update};

use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{
        AccessControlService, AccessControlServiceImpl, UserProfileService, UserProfileServiceImpl,
    },
};

#[query]
#[log_errors]
fn get_my_user_profile() -> ApiResult<GetMyUserProfileResponse> {
    let calling_principal = msg_caller();

    UserProfileController::default()
        .get_my_user_profile(calling_principal)
        .into()
}

#[update]
#[log_errors]
fn create_my_user_profile() -> ApiResult<CreateMyUserProfileResponse> {
    let calling_principal = msg_caller();

    UserProfileController::default()
        .create_my_user_profile(calling_principal)
        .into()
}

#[update]
#[log_errors]
fn update_my_user_profile(request: UpdateMyUserProfileRequest) -> ApiResult<()> {
    let calling_principal = msg_caller();

    UserProfileController::default()
        .update_my_user_profile(calling_principal, request)
        .into()
}

#[update]
#[log_errors]
fn update_user_profile(request: UpdateUserProfileRequest) -> ApiResult<()> {
    let calling_principal = msg_caller();

    UserProfileController::default()
        .update_user_profile(calling_principal, request)
        .into()
}

#[update]
#[log_errors]
fn delete_user_profile(request: DeleteUserProfileRequest) -> ApiResult<()> {
    let calling_principal = msg_caller();

    UserProfileController::default()
        .delete_user_profile(calling_principal, request)
        .into()
}

#[query]
#[log_errors]
fn list_users() -> ApiResult<ListUsersResponse> {
    let calling_principal = msg_caller();

    UserProfileController::default()
        .list_users(calling_principal)
        .into()
}

struct UserProfileController<A: AccessControlService, U: UserProfileService> {
    access_control_service: A,
    user_profile_service: U,
}

impl Default
    for UserProfileController<
        AccessControlServiceImpl<UserProfileRepositoryImpl>,
        UserProfileServiceImpl<UserProfileRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(
            AccessControlServiceImpl::default(),
            UserProfileServiceImpl::default(),
        )
    }
}

impl<A: AccessControlService, U: UserProfileService> UserProfileController<A, U> {
    fn new(access_control_service: A, user_profile_service: U) -> Self {
        Self {
            access_control_service,
            user_profile_service,
        }
    }

    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        self.user_profile_service
            .get_my_user_profile(calling_principal)
    }

    fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        self.user_profile_service
            .create_my_user_profile(calling_principal)
    }

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;

        self.user_profile_service
            .update_my_user_profile(calling_principal, request)?;

        Ok(())
    }

    fn update_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateUserProfileRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.user_profile_service.update_user_profile(request)?;

        Ok(())
    }

    fn delete_user_profile(
        &self,
        calling_principal: Principal,
        request: DeleteUserProfileRequest,
    ) -> Result<(), ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.user_profile_service
            .delete_user_profile(calling_principal, request)
    }

    fn list_users(&self, calling_principal: Principal) -> Result<ListUsersResponse, ApiError> {
        self.access_control_service
            .assert_principal_not_anonymous(&calling_principal)?;
        self.access_control_service
            .assert_principal_is_admin(&calling_principal)?;

        self.user_profile_service.list_users()
    }
}
