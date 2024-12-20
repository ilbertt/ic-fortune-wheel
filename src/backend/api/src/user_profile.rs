use candid::{CandidType, Deserialize};

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct GetMyUserProfileResponse {
    pub id: String,
    pub username: String,
}

#[derive(Debug, Clone, CandidType, PartialEq, Eq)]
pub struct CreateMyUserProfileResponse {
    pub id: String,
    pub username: String,
}

#[derive(Debug, Clone, CandidType, Deserialize, PartialEq, Eq)]
pub struct UpdateMyUserProfileRequest {
    pub username: Option<String>,
}
