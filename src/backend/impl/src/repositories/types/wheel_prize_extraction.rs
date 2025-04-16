use std::{borrow::Cow, fmt::Display, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use common_types::{TimestampFields, Timestamped, Uuid};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{UserId, WheelAssetId};

pub type WheelPrizeExtractionId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum WheelPrizeExtractionStateOld {
    Processing,
    Completed {
        wheel_asset_id: WheelAssetId,
        prize_usd_amount: Option<f64>,
    },
    Failed {
        error: ApiError,
    },
}

impl From<WheelPrizeExtractionStateOld> for WheelPrizeExtractionState {
    fn from(old: WheelPrizeExtractionStateOld) -> Self {
        match old {
            WheelPrizeExtractionStateOld::Processing => WheelPrizeExtractionState::Processing,
            WheelPrizeExtractionStateOld::Completed {
                prize_usd_amount, ..
            } => WheelPrizeExtractionState::Completed { prize_usd_amount },
            WheelPrizeExtractionStateOld::Failed { error } => {
                WheelPrizeExtractionState::Failed { error }
            }
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct WheelPrizeExtractionOld {
    pub extracted_for_principal: Principal,
    pub state: WheelPrizeExtractionStateOld,
    pub extracted_by_user_id: UserId,
    pub timestamps: TimestampFields,
}

impl From<WheelPrizeExtractionOld> for WheelPrizeExtraction {
    fn from(old: WheelPrizeExtractionOld) -> Self {
        let wheel_asset_id = match old.state {
            WheelPrizeExtractionStateOld::Completed { wheel_asset_id, .. } => Some(wheel_asset_id),
            WheelPrizeExtractionStateOld::Processing
            | WheelPrizeExtractionStateOld::Failed { .. } => None,
        };

        Self {
            extracted_for_principal: old.extracted_for_principal,
            state: old.state.into(),
            extracted_by_user_id: old.extracted_by_user_id,
            timestamps: old.timestamps,
            wheel_asset_id,
        }
    }
}

impl Storable for WheelPrizeExtractionOld {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum WheelPrizeExtractionState {
    Processing,
    Completed { prize_usd_amount: Option<f64> },
    Failed { error: ApiError },
}

impl From<&WheelPrizeExtractionState> for u8 {
    fn from(state: &WheelPrizeExtractionState) -> u8 {
        match state {
            WheelPrizeExtractionState::Processing => 1,
            WheelPrizeExtractionState::Completed { .. } => 2,
            WheelPrizeExtractionState::Failed { .. } => 3,
        }
    }
}

impl Display for WheelPrizeExtractionState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WheelPrizeExtractionState::Processing => write!(f, "Processing"),
            WheelPrizeExtractionState::Completed { prize_usd_amount } => {
                write!(f, "Completed (prize_usd_amount:{:?})", prize_usd_amount)
            }
            WheelPrizeExtractionState::Failed { error } => write!(f, "Failed (error:{error})",),
        }
    }
}

impl WheelPrizeExtractionState {
    pub fn default_completed() -> Self {
        Self::Completed {
            prize_usd_amount: None,
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct WheelPrizeExtraction {
    pub extracted_for_principal: Principal,
    pub state: WheelPrizeExtractionState,
    pub extracted_by_user_id: UserId,
    pub timestamps: TimestampFields,
    pub wheel_asset_id: Option<WheelAssetId>,
}

impl WheelPrizeExtraction {
    pub fn new_processing(
        extracted_for_principal: Principal,
        extracted_by_user_id: UserId,
    ) -> Self {
        Self {
            extracted_for_principal,
            state: WheelPrizeExtractionState::Processing,
            extracted_by_user_id,
            timestamps: TimestampFields::default(),
            wheel_asset_id: None,
        }
    }

    pub fn set_completed(&mut self, wheel_asset_id: WheelAssetId, prize_usd_amount: Option<f64>) {
        self.state = WheelPrizeExtractionState::Completed { prize_usd_amount };
        self.wheel_asset_id = Some(wheel_asset_id);
    }

    pub fn set_failed(&mut self, wheel_asset_id: Option<WheelAssetId>, error: ApiError) {
        self.state = WheelPrizeExtractionState::Failed { error };
        self.wheel_asset_id = wheel_asset_id;
    }

    pub fn is_failed(&self) -> bool {
        matches!(self.state, WheelPrizeExtractionState::Failed { .. })
    }
}

impl Timestamped for WheelPrizeExtraction {
    fn update_timestamp(&mut self) {
        self.timestamps.update();
    }
}

impl Storable for WheelPrizeExtraction {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match Decode!(bytes.as_ref(), WheelPrizeExtractionOld) {
            Ok(old) => old.into(),
            Err(_) => Decode!(bytes.as_ref(), Self).unwrap(),
        }
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

// TODO: implement filters for asset id range in API
// pub struct WheelPrizeExtractionAssetIdRange {
//     start_bound: WheelPrizeExtractionAssetIdKey,
//     end_bound: WheelPrizeExtractionAssetIdKey,
// }

// impl WheelPrizeExtractionAssetIdRange {
//     pub fn new(wheel_asset_id: WheelAssetId) -> Result<Self, ApiError> {
//         Ok(Self {
//             start_bound: WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, Uuid::min())?,
//             end_bound: WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, Uuid::max())?,
//         })
//     }
// }

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

// TODO: implement filters for user id range in API
// pub struct WheelPrizeExtractionUserIdRange {
//     start_bound: WheelPrizeExtractionUserIdKey,
//     end_bound: WheelPrizeExtractionUserIdKey,
// }

// impl WheelPrizeExtractionUserIdRange {
//     pub fn new(user_id: UserId) -> Result<Self, ApiError> {
//         Ok(Self {
//             start_bound: WheelPrizeExtractionUserIdKey::new(user_id, Uuid::min())?,
//             end_bound: WheelPrizeExtractionUserIdKey::new(user_id, Uuid::max())?,
//         })
//     }
// }

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use common_types::fixtures::uuid;
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
    #[case::completed(fixtures::old_wheel_prize_extraction_completed())]
    #[case::pending(fixtures::old_wheel_prize_extraction_pending())]
    #[case::failed(fixtures::old_wheel_prize_extraction_failed())]
    fn storable_impl_compat(#[case] old_wheel_prize_extraction: WheelPrizeExtractionOld) {
        let old_serialized_wheel_prize_extraction = old_wheel_prize_extraction.to_bytes();
        let new_deserialized_wheel_prize_extraction =
            WheelPrizeExtraction::from_bytes(old_serialized_wheel_prize_extraction);

        assert_eq!(
            old_wheel_prize_extraction.extracted_by_user_id,
            new_deserialized_wheel_prize_extraction.extracted_by_user_id
        );
        assert_eq!(
            old_wheel_prize_extraction.extracted_for_principal,
            new_deserialized_wheel_prize_extraction.extracted_for_principal
        );
        assert_eq!(
            old_wheel_prize_extraction.timestamps,
            new_deserialized_wheel_prize_extraction.timestamps
        );
        match old_wheel_prize_extraction.state {
            WheelPrizeExtractionStateOld::Completed {
                wheel_asset_id: old_wheel_asset_id,
                prize_usd_amount: old_prize_usd_amount,
            } => match new_deserialized_wheel_prize_extraction.state {
                WheelPrizeExtractionState::Completed {
                    prize_usd_amount: new_prize_usd_amount,
                } => {
                    assert_eq!(old_prize_usd_amount, new_prize_usd_amount);
                    assert_eq!(
                        old_wheel_asset_id,
                        new_deserialized_wheel_prize_extraction
                            .wheel_asset_id
                            .unwrap()
                    );
                }
                _ => panic!("Expected completed state"),
            },
            WheelPrizeExtractionStateOld::Failed { error: old_error } => {
                match new_deserialized_wheel_prize_extraction.state {
                    WheelPrizeExtractionState::Failed { error: new_error } => {
                        assert_eq!(old_error, new_error);
                    }
                    _ => panic!("Expected failed state"),
                }
            }
            WheelPrizeExtractionStateOld::Processing => {
                assert_eq!(
                    new_deserialized_wheel_prize_extraction.state,
                    WheelPrizeExtractionState::Processing
                );
            }
        }
    }

    #[rstest]
    #[case::processing(WheelPrizeExtractionState::Processing)]
    #[case::completed(WheelPrizeExtractionState::Completed { prize_usd_amount: Some(1.5) })]
    #[case::failed(WheelPrizeExtractionState::Failed { error: ApiError::internal("error") })]
    fn wheel_prize_extraction_state_key_storable_impl(#[case] state: WheelPrizeExtractionState) {
        let wheel_prize_extraction_id = uuid();
        let key = WheelPrizeExtractionStateKey::new(&state, wheel_prize_extraction_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = WheelPrizeExtractionStateKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn wheel_prize_extraction_asset_id_key_storable_impl() {
        let wheel_asset_id = uuid();
        let wheel_prize_extraction_id = uuid();
        let key =
            WheelPrizeExtractionAssetIdKey::new(wheel_asset_id, wheel_prize_extraction_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = WheelPrizeExtractionAssetIdKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    fn wheel_prize_extraction_user_id_key_storable_impl() {
        let user_id = uuid();
        let wheel_prize_extraction_id = uuid();
        let key = WheelPrizeExtractionUserIdKey::new(user_id, wheel_prize_extraction_id).unwrap();
        let serialized_key = key.to_bytes();
        let deserialized_key = WheelPrizeExtractionUserIdKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
