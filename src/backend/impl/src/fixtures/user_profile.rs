use rstest::*;

use crate::repositories::{TimestampFields, UserProfile, UserRole};

use super::principal;

#[fixture]
pub fn user_profile() -> UserProfile {
    UserProfile {
        username: "ZurichExplorer2023".to_string(),
        timestamps: TimestampFields::new(),
        role: UserRole::Scanner,
        principal: principal(),
    }
}
