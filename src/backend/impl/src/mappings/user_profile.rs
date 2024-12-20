use backend_api::{CreateMyUserProfileResponse, GetMyUserProfileResponse};

use crate::repositories::{UserId, UserProfile};

pub fn map_get_my_user_profile_response(
    user_id: UserId,
    user_profile: UserProfile,
) -> GetMyUserProfileResponse {
    GetMyUserProfileResponse {
        id: user_id.to_string(),
        username: user_profile.username,
    }
}

pub fn map_create_my_user_profile_response(
    user_id: UserId,
    user_profile: UserProfile,
) -> CreateMyUserProfileResponse {
    CreateMyUserProfileResponse {
        id: user_id.to_string(),
        username: user_profile.username,
    }
}
