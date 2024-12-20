use backend_api::{
    ApiError, CreateMyUserProfileResponse, GetMyUserProfileResponse, ListUsersResponse,
    UpdateMyUserProfileRequest, UpdateUserProfileRequest,
};
use candid::Principal;

use crate::{
    mappings::map_user_profile,
    repositories::{UserId, UserProfile, UserProfileRepository, UserProfileRepositoryImpl},
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

    fn update_user_profile(&self, request: UpdateUserProfileRequest) -> Result<(), ApiError>;

    fn list_users(&self) -> Result<ListUsersResponse, ApiError>;
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

        Ok(map_user_profile(id, profile))
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

        let profile = UserProfile::new_unassigned();
        let id = self
            .user_profile_repository
            .create_user_profile(calling_principal, profile.clone())
            .await?;

        Ok(map_user_profile(id, profile))
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

    fn update_user_profile(&self, request: UpdateUserProfileRequest) -> Result<(), ApiError> {
        let user_id = UserId::try_from(request.user_id.as_str())?;
        let mut current_user_profile = self
            .user_profile_repository
            .get_user_profile_by_user_id(&user_id)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "User profile for user with id {user_id} not found",
                ))
            })?;

        if let Some(username) = request.username {
            current_user_profile.username = username;
        }

        if let Some(role) = request.role {
            current_user_profile.role = role.into();
        }

        self.user_profile_repository
            .update_user_profile(user_id, current_user_profile)?;

        Ok(())
    }

    fn list_users(&self) -> Result<ListUsersResponse, ApiError> {
        let users = self.user_profile_repository.list_users();

        Ok(users
            .into_iter()
            .map(|(id, profile)| map_user_profile(id, profile))
            .collect())
    }
}

impl<T: UserProfileRepository> UserProfileServiceImpl<T> {
    fn new(user_profile_repository: T) -> Self {
        Self {
            user_profile_repository,
        }
    }
}
