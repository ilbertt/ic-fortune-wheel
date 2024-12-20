use candid::{CandidType, Deserialize, Principal};

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub enum UserRole {
    #[serde(rename = "admin")]
    Admin,
    #[serde(rename = "user")]
    User,
    #[serde(rename = "unassigned")]
    Unassigned,
}

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct UserProfile {
    pub id: String,
    pub principal_id: Principal,
    pub username: String,
    pub role: UserRole,
}

pub type GetMyUserProfileResponse = UserProfile;

pub type CreateMyUserProfileResponse = UserProfile;

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateMyUserProfileRequest {
    pub username: Option<String>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateUserProfileRequest {
    pub user_id: String,
    pub username: Option<String>,
    pub role: Option<UserRole>,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct DeleteUserProfileRequest {
    pub user_id: String,
}

pub type ListUsersResponse = Vec<UserProfile>;
