use backend_api::{
    ApiError, ApiResult, CreateMyUserProfileResponse, GetMyUserProfileResponse,
    UpdateMyUserProfileRequest,
};
use backend_macros::log_errors;
use candid::Principal;
use ic_cdk::{caller, query, update};

use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{UserProfileService, UserProfileServiceImpl},
};

#[query]
#[log_errors]
fn get_my_user_profile() -> ApiResult<GetMyUserProfileResponse> {
    let calling_principal = caller();

    UserProfileController::default()
        .get_my_user_profile(calling_principal)
        .into()
}

#[update]
#[log_errors]
async fn create_my_user_profile() -> ApiResult<CreateMyUserProfileResponse> {
    let calling_principal = caller();

    UserProfileController::default()
        .create_my_user_profile(calling_principal)
        .await
        .into()
}

#[update]
#[log_errors]
fn update_my_user_profile(request: UpdateMyUserProfileRequest) -> ApiResult<()> {
    let calling_principal = caller();

    UserProfileController::default()
        .update_my_user_profile(calling_principal, request)
        .into()
}

struct UserProfileController<U: UserProfileService> {
    user_profile_service: U,
}

impl Default for UserProfileController<UserProfileServiceImpl<UserProfileRepositoryImpl>> {
    fn default() -> Self {
        Self::new(UserProfileServiceImpl::default())
    }
}

impl<U: UserProfileService> UserProfileController<U> {
    fn new(user_profile_service: U) -> Self {
        Self {
            user_profile_service,
        }
    }

    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError> {
        self.user_profile_service
            .get_my_user_profile(calling_principal)
    }

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError> {
        self.user_profile_service
            .create_my_user_profile(calling_principal)
            .await
    }

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError> {
        self.user_profile_service
            .update_my_user_profile(calling_principal, request)?;

        Ok(())
    }
}
