use backend_api::ApiError;
use candid::Principal;

use crate::repositories::{UserProfile, UserProfileRepository, UserProfileRepositoryImpl};

#[cfg_attr(test, mockall::automock)]
pub trait InitService {
    async fn init(&self, calling_principal: Principal) -> Result<(), ApiError>;
}

pub struct InitServiceImpl<T: UserProfileRepository> {
    user_profile_repository: T,
}

impl Default for InitServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<T: UserProfileRepository> InitService for InitServiceImpl<T> {
    async fn init(&self, calling_principal: Principal) -> Result<(), ApiError> {
        if self
            .user_profile_repository
            .get_user_by_principal(&calling_principal)
            .is_some()
        {
            return Ok(());
        }

        let profile = UserProfile::new_admin(calling_principal);

        self.user_profile_repository
            .create_user_profile(calling_principal, profile)
            .await?;

        Ok(())
    }
}

impl<T: UserProfileRepository> InitServiceImpl<T> {
    fn new(user_profile_repository: T) -> Self {
        Self {
            user_profile_repository,
        }
    }
}
