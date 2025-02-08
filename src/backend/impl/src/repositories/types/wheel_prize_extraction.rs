use std::{borrow::Cow, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{TimestampFields, UserId, Uuid, WheelAssetId};

pub type WheelPrizeExtractionId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum WheelPrizeExtractionState {
    Processing,
    Completed,
    Failed,
}

impl From<&WheelPrizeExtractionState> for u8 {
    fn from(state: &WheelPrizeExtractionState) -> u8 {
        match state {
            WheelPrizeExtractionState::Processing => 1,
            WheelPrizeExtractionState::Completed => 2,
            WheelPrizeExtractionState::Failed => 3,
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct WheelPrizeExtraction {
    pub extracted_for_principal: Principal,
    pub wheel_asset_id: WheelAssetId,
    pub state: WheelPrizeExtractionState,
    pub extracted_by_user_id: UserId,
    pub timestamps: TimestampFields,
}

impl Storable for WheelPrizeExtraction {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct WheelPrizeExtractionStateKey(Blob<{ Self::MAX_SIZE as usize }>);

impl WheelPrizeExtractionStateKey {
    const MAX_SIZE: u32 = <(u8, WheelPrizeExtractionId)>::BOUND.max_size();

    pub fn new(
        state: &WheelPrizeExtractionState,
        wheel_prize_extraction_id: WheelPrizeExtractionId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from(
                (u8::from(state), wheel_prize_extraction_id)
                    .to_bytes()
                    .as_ref(),
            )
            .map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert state {:?}, wheel prize extraction id {:?} to bytes.",
                    state, wheel_prize_extraction_id
                ))
            })?,
        ))
    }
}

impl Storable for WheelPrizeExtractionStateKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct WheelPrizeExtractionStateRange {
    start_bound: WheelPrizeExtractionStateKey,
    end_bound: WheelPrizeExtractionStateKey,
}

impl WheelPrizeExtractionStateRange {
    pub fn new(state: &WheelPrizeExtractionState) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: WheelPrizeExtractionStateKey::new(state, Uuid::min())?,
            end_bound: WheelPrizeExtractionStateKey::new(state, Uuid::max())?,
        })
    }
}

impl RangeBounds<WheelPrizeExtractionStateKey> for WheelPrizeExtractionStateRange {
    fn start_bound(&self) -> std::ops::Bound<&WheelPrizeExtractionStateKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&WheelPrizeExtractionStateKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct WheelPrizeExtractionAssetIdKey(Blob<{ Self::MAX_SIZE as usize }>);

impl WheelPrizeExtractionAssetIdKey {
    const MAX_SIZE: u32 = <(WheelAssetId, WheelPrizeExtractionId)>::BOUND.max_size();

    pub fn new(
        wheel_asset_id: WheelAssetId,
        wheel_prize_extraction_id: WheelPrizeExtractionId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from(
                (wheel_asset_id, wheel_prize_extraction_id)
                    .to_bytes()
                    .as_ref(),
            )
            .map_err(|_| {
                ApiError::internal(&format!(
                    "Failed to convert wheel asset id {:?}, wheel prize extraction id {:?} to bytes.",
                    wheel_asset_id, wheel_prize_extraction_id
                ))
            })?,
        ))
    }
}

impl Storable for WheelPrizeExtractionAssetIdKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct WheelPrizeExtractionAssetIdRange {
    start_bound: WheelPrizeExtractionAssetIdKey,
    end_bound: WheelPrizeExtractionAssetIdKey,
}

impl WheelPrizeExtractionAssetIdRange {
    pub fn new(wheel_asset_id: WheelAssetId) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, Uuid::min())?,
            end_bound: WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, Uuid::max())?,
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct WheelPrizeExtractionUserIdKey(Blob<{ Self::MAX_SIZE as usize }>);

impl WheelPrizeExtractionUserIdKey {
    const MAX_SIZE: u32 = <(UserId, WheelPrizeExtractionId)>::BOUND.max_size();

    pub fn new(
        user_id: UserId,
        wheel_prize_extraction_id: WheelPrizeExtractionId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((user_id, wheel_prize_extraction_id).to_bytes().as_ref()).map_err(
                |_| {
                    ApiError::internal(&format!(
                        "Failed to convert user id {:?}, wheel prize extraction id {:?} to bytes.",
                        user_id, wheel_prize_extraction_id
                    ))
                },
            )?,
        ))
    }
}

impl Storable for WheelPrizeExtractionUserIdKey {
    fn to_bytes(&self) -> Cow<[u8]> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Self(Blob::from_bytes(bytes))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Self::MAX_SIZE,
        is_fixed_size: true,
    };
}

pub struct WheelPrizeExtractionUserIdRange {
    start_bound: WheelPrizeExtractionUserIdKey,
    end_bound: WheelPrizeExtractionUserIdKey,
}

impl WheelPrizeExtractionUserIdRange {
    pub fn new(user_id: UserId) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: WheelPrizeExtractionUserIdKey::new(user_id, Uuid::min())?,
            end_bound: WheelPrizeExtractionUserIdKey::new(user_id, Uuid::max())?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case(fixtures::wheel_prize_extraction())]
    fn storable_impl(#[case] wheel_prize_extraction: WheelPrizeExtraction) {
        let serialized_wheel_prize_extraction = wheel_prize_extraction.to_bytes();
        let deserialized_wheel_prize_extraction =
            WheelPrizeExtraction::from_bytes(serialized_wheel_prize_extraction);

        assert_eq!(wheel_prize_extraction, deserialized_wheel_prize_extraction);
    }

    #[rstest]
    #[case::processing(WheelPrizeExtractionState::Processing)]
    #[case::completed(WheelPrizeExtractionState::Completed)]
    #[case::failed(WheelPrizeExtractionState::Failed)]
    fn wheel_prize_extraction_state_key_storable_impl(#[case] state: WheelPrizeExtractionState) {
        let wheel_prize_extraction_id = fixtures::uuid();
        let key = WheelPrizeExtractionStateKey::new(&state, wheel_prize_extraction_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = WheelPrizeExtractionStateKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn wheel_prize_extraction_asset_id_key_storable_impl() {
        let wheel_asset_id = fixtures::uuid();
        let wheel_prize_extraction_id = fixtures::uuid();
        let key =
            WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, wheel_prize_extraction_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = WheelPrizeExtractionAssetIdKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn wheel_prize_extraction_user_id_key_storable_impl() {
        let user_id = fixtures::uuid();
        let wheel_prize_extraction_id = fixtures::uuid();
        let key = WheelPrizeExtractionUserIdKey::new(user_id, wheel_prize_extraction_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = WheelPrizeExtractionUserIdKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
