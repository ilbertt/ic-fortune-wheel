use crate::repositories::{UserId, UserProfile, UserRole};

impl From<UserRole> for backend_api::UserRole {
    fn from(value: UserRole) -> Self {
        match value {
            UserRole::Admin => backend_api::UserRole::Admin,
            UserRole::User => backend_api::UserRole::User,
            UserRole::Unassigned => backend_api::UserRole::Unassigned,
        }
    }
}

impl From<backend_api::UserRole> for UserRole {
    fn from(value: backend_api::UserRole) -> Self {
        match value {
            backend_api::UserRole::Admin => UserRole::Admin,
            backend_api::UserRole::User => UserRole::User,
            backend_api::UserRole::Unassigned => UserRole::Unassigned,
        }
    }
}

pub fn map_user_profile(user_id: UserId, user_profile: UserProfile) -> backend_api::UserProfile {
    backend_api::UserProfile {
        id: user_id.to_string(),
        username: user_profile.username,
        role: user_profile.role.into(),
    }
}
