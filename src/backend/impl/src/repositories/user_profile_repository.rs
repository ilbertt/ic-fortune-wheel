use backend_api::ApiError;
use candid::Principal;
use std::cell::RefCell;

use super::{
    init_user_profile_principal_index, init_user_profiles, Timestamped, UserId, UserProfile,
    UserProfileMemory, UserProfilePrincipalIndexMemory,
};

#[cfg_attr(test, mockall::automock)]
pub trait UserProfileRepository {
    fn get_user_by_principal(&self, principal: &Principal) -> Option<(UserId, UserProfile)>;

    fn get_user_profile_by_user_id(&self, user_id: &UserId) -> Option<UserProfile>;

    async fn create_user_profile(
        &self,
        calling_principal: Principal,
        user_profile: UserProfile,
    ) -> Result<UserId, ApiError>;

    fn update_user_profile(
        &self,
        user_id: UserId,
        user_profile: UserProfile,
    ) -> Result<(), ApiError>;

    fn delete_user_profile(&self, user_id: &UserId) -> Result<(), ApiError>;

    fn list_users(&self) -> Vec<(UserId, UserProfile)>;
}

pub struct UserProfileRepositoryImpl {}

impl Default for UserProfileRepositoryImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl UserProfileRepository for UserProfileRepositoryImpl {
    fn get_user_by_principal(&self, principal: &Principal) -> Option<(UserId, UserProfile)> {
        STATE
            .with(|state| state.borrow().principal_index.get(principal))
            .and_then(|user_id| {
                self.get_user_profile_by_user_id(&user_id)
                    .map(|user_profile| (user_id, user_profile))
            })
    }

    fn get_user_profile_by_user_id(&self, user_id: &UserId) -> Option<UserProfile> {
        STATE.with_borrow(|s| s.profiles.get(user_id))
    }

    async fn create_user_profile(
        &self,
        calling_principal: Principal,
        user_profile: UserProfile,
    ) -> Result<UserId, ApiError> {
        let user_id = UserId::new().await?;

        STATE.with_borrow_mut(|s| {
            s.profiles.insert(user_id, user_profile.clone());
            s.principal_index.insert(calling_principal, user_id);

            Ok(())
        })?;

        Ok(user_id)
    }

    fn update_user_profile(
        &self,
        user_id: UserId,
        mut user_profile: UserProfile,
    ) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            user_profile.update_timestamp();
            s.profiles.insert(user_id, user_profile);

            Ok(())
        })
    }

    fn delete_user_profile(&self, user_id: &UserId) -> Result<(), ApiError> {
        STATE.with_borrow_mut(|s| {
            match s.profiles.remove(user_id) {
                None => {
                    return Err(ApiError::not_found(&format!(
                        "User profile for user with id {user_id} not found"
                    )))
                }
                Some(user) => s.principal_index.remove(&user.principal),
            };

            Ok(())
        })
    }

    fn list_users(&self) -> Vec<(UserId, UserProfile)> {
        STATE.with_borrow(|s| s.profiles.iter().collect())
    }
}

impl UserProfileRepositoryImpl {
    pub fn new() -> Self {
        Self {}
    }
}

struct UserProfileState {
    profiles: UserProfileMemory,
    principal_index: UserProfilePrincipalIndexMemory,
}

impl Default for UserProfileState {
    fn default() -> Self {
        Self {
            profiles: init_user_profiles(),
            principal_index: init_user_profile_principal_index(),
        }
    }
}

thread_local! {
    static STATE: RefCell<UserProfileState> = RefCell::new(UserProfileState::default());
}
