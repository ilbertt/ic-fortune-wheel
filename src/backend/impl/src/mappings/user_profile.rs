use crate::repositories::{UserId, UserProfile, UserRole};

impl From<UserRole> for backend_api::UserRole {
    fn from(value: UserRole) -> Self {
        match value {
            UserRole::Admin => backend_api::UserRole::Admin,
            UserRole::Scanner => backend_api::UserRole::Scanner,
            UserRole::Unassigned => backend_api::UserRole::Unassigned,
        }
    }
}

impl From<backend_api::UserRole> for UserRole {
    fn from(value: backend_api::UserRole) -> Self {
        match value {
            backend_api::UserRole::Admin => UserRole::Admin,
            backend_api::UserRole::Scanner => UserRole::Scanner,
            backend_api::UserRole::Unassigned => UserRole::Unassigned,
        }
    }
}

pub fn map_user_profile(user_id: UserId, user_profile: UserProfile) -> backend_api::UserProfile {
    backend_api::UserProfile {
        id: user_id.to_string(),
        principal_id: user_profile.principal,
        username: user_profile.username,
        role: user_profile.role.into(),
    }
}
