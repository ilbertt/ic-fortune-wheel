use crate::repositories::{UserProfileRepository, UserProfileRepositoryImpl};
use backend_api::ApiError;
use candid::Principal;

#[cfg_attr(test, mockall::automock)]
pub trait AccessControlService {
    fn assert_principal_not_anonymous(&self, calling_principal: &Principal)
        -> Result<(), ApiError>;

    fn assert_principal_is_admin(&self, calling_principal: &Principal) -> Result<(), ApiError>;

    fn assert_principal_is_user_or_admin(
        &self,
        calling_principal: &Principal,
    ) -> Result<(), ApiError>;
}

pub struct AccessControlServiceImpl<T: UserProfileRepository> {
    user_profile_repository: T,
}

impl Default for AccessControlServiceImpl<UserProfileRepositoryImpl> {
    fn default() -> Self {
        Self::new(UserProfileRepositoryImpl::default())
    }
}

impl<T: UserProfileRepository> AccessControlService for AccessControlServiceImpl<T> {
    fn assert_principal_not_anonymous(
        &self,
        calling_principal: &Principal,
    ) -> Result<(), ApiError> {
        if calling_principal == &Principal::anonymous() {
            return Err(ApiError::unauthenticated());
        }

        Ok(())
    }

    fn assert_principal_is_admin(&self, calling_principal: &Principal) -> Result<(), ApiError> {
        let (_id, profile) = self
            .user_profile_repository
            .get_user_by_principal(calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Principal {} must have a profile to call this endpoint",
                    calling_principal.to_text()
                ))
            })?;

        if !profile.is_admin() {
            return Err(ApiError::permission_denied(&format!(
                "Principal {} must be an admin to call this endpoint",
                calling_principal.to_text()
            )));
        }

        Ok(())
    }

    fn assert_principal_is_user_or_admin(
        &self,
        calling_principal: &Principal,
    ) -> Result<(), ApiError> {
        let (_id, profile) = self
            .user_profile_repository
            .get_user_by_principal(calling_principal)
            .ok_or_else(|| {
                ApiError::not_found(&format!(
                    "Principal {} must have a profile to call this endpoint",
                    calling_principal.to_text()
                ))
            })?;

        if !profile.is_user() && !profile.is_admin() {
            return Err(ApiError::permission_denied(&format!(
                "Principal {} must be an admin or a user to call this endpoint",
                calling_principal.to_text()
            )));
        }

        Ok(())
    }
}

impl<T: UserProfileRepository> AccessControlServiceImpl<T> {
    fn new(user_profile_repository: T) -> Self {
        Self {
            user_profile_repository,
        }
    }
}
