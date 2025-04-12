use rstest::*;
use types::fixtures::principal;

use crate::repositories::{TimestampFields, UserProfile, UserRole};

#[fixture]
pub fn user_profile() -> UserProfile {
    UserProfile {
        username: "ZurichExplorer2023".to_string(),
        timestamps: TimestampFields::new(),
        role: UserRole::Scanner,
        principal: principal(),
    }
}
