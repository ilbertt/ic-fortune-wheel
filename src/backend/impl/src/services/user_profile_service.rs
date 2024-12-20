use backend_api::{
    ApiError, CreateMyUserProfileResponse, GetMyUserProfileResponse, UpdateMyUserProfileRequest,
};
use candid::Principal;

use crate::{
    mappings::{map_create_my_user_profile_response, map_get_my_user_profile_response},
    repositories::{Timestamped, UserProfile, UserProfileRepository, UserProfileRepositoryImpl},
};

#[cfg_attr(test, mockall::automock)]
pub trait UserProfileService {
    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError>;

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError>;

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError>;
}

pub struct UserProfileServiceImpl<T: UserProfileRepository> {
    user_profile_repository: T,
}

impl Default for UserProfileServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<T: UserProfileRepository> UserProfileService for UserProfileServiceImpl<T> {
    fn get_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<GetMyUserProfileResponse, ApiError> {
        let (id, profile) = self
            .user_profile_repository
            .get_user_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile with principal {} not found",
                    &calling_principal.to_text()
                ))
            })?;

        Ok(map_get_my_user_profile_response(id, profile))
    }

    async fn create_my_user_profile(
        &self,
        calling_principal: Principal,
    ) -> Result<CreateMyUserProfileResponse, ApiError> {
        if self
            .user_profile_repository
            .get_user_by_principal(&calling_principal)
            .is_some()
        {
            return Err(ApiError::conflict(&format!(
                "User profile for principal {} already exists",
                calling_principal.to_text()
            )));
        }

        let profile = UserProfile::new();
        let id = self
            .user_profile_repository
            .create_user_profile(calling_principal, profile.clone())
            .await?;

        Ok(map_create_my_user_profile_response(id, profile))
    }

    fn update_my_user_profile(
        &self,
        calling_principal: Principal,
        request: UpdateMyUserProfileRequest,
    ) -> Result<(), ApiError> {
        let (user_id, _) = self
            .user_profile_repository
            .get_user_by_principal(&calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User id for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        let mut current_user_profile = self
            .user_profile_repository
            .get_user_profile_by_user_id(&user_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile for principal {} not found",
                    calling_principal.to_text()
                ))
            })?;

        if let Some(username) = request.username {
            current_user_profile.username = username;
        }

        self.user_profile_repository
            .update_user_profile(user_id, current_user_profile)?;

        Ok(())
    }
}

impl<T: UserProfileRepository> UserProfileServiceImpl<T> {
    fn new(user_profile_repository: T) -> Self {
        Self {
            user_profile_repository,
        }
    }
}
