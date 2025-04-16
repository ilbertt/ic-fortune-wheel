use common_types::{fixtures::principal, TimestampFields};
use rstest::*;

use crate::repositories::{UserProfile, UserRole};

#[fixture]
pub fn user_profile() -> UserProfile {
    UserProfile {
        username: "ZurichExplorer2023".to_string(),
        timestamps: TimestampFields::default(),
        role: UserRole::Scanner,
        principal: principal(),
    }
}
