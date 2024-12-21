use std::{borrow::Cow, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{TimestampFields, Timestamped, Uuid};

pub type WheelAssetId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub enum WheelAssetType {
    Token { ledger_canister_id: Principal },
    Gadget,
    Jackpot,
}

#[derive(Debug, Clone, Copy, CandidType, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
// We're explicit about the enum values here because they are serialized
// to u8 when the state is used as a key and we want to make sure that the
// values are stable.
#[repr(u8)]
pub enum WheelAssetState {
    Enabled = 1,
    Disabled = 2,
}

impl From<WheelAssetState> for u8 {
    fn from(state: WheelAssetState) -> u8 {
        state as u8
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq, Eq)]
pub struct WheelAsset {
    pub name: String,
    pub asset_type: WheelAssetType,
    pub total_amount: u32,
    pub used_amount: u32,
    pub state: WheelAssetState,
    pub timestamps: TimestampFields,
}

impl WheelAsset {
    pub fn use_one(&mut self) -> Result<(), ApiError> {
        if self.total_amount == 0 {
            return Err(ApiError::internal("Asset total amount is 0"));
        }
        if self.used_amount >= self.total_amount {
            return Err(ApiError::internal("Asset out of stock"));
        }
        self.used_amount += 1;
        Ok(())
    }
}

impl Timestamped for WheelAsset {
    fn update_timestamp(&mut self) {
        self.timestamps.update();
    }
}

impl Storable for WheelAsset {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct WheelAssetStateKey(Blob<{ Self::MAX_SIZE as usize }>);

impl WheelAssetStateKey {
    const MAX_SIZE: u32 = <(u8, WheelAssetId)>::BOUND.max_size();

    pub fn new(state: WheelAssetState, wheel_asset_id: WheelAssetId) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((u8::from(state), wheel_asset_id).to_bytes().as_ref()).map_err(
                |_| {
                    ApiError::internal(&format!(
                        "Failed to convert state {:?}, wheel asset id {:?} to bytes.",
                        state, wheel_asset_id
                    ))
                },
            )?,
        ))
    }
}

impl Storable for WheelAssetStateKey {
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

pub struct WheelAssetStateRange {
    start_bound: WheelAssetStateKey,
    end_bound: WheelAssetStateKey,
}

impl WheelAssetStateRange {
    pub fn new(state: WheelAssetState) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: WheelAssetStateKey::new(state, Uuid::MIN)?,
            end_bound: WheelAssetStateKey::new(state, Uuid::MAX)?,
        })
    }
}

impl RangeBounds<WheelAssetStateKey> for WheelAssetStateRange {
    fn start_bound(&self) -> std::ops::Bound<&WheelAssetStateKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&WheelAssetStateKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

pub fn icp_wheel_asset() -> WheelAsset {
    WheelAsset {
        name: "ICP".to_string(),
        asset_type: WheelAssetType::Token {
            ledger_canister_id: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
        },
        total_amount: 0,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        timestamps: TimestampFields::new(),
    }
}

pub fn ckbtc_wheel_asset() -> WheelAsset {
    WheelAsset {
        name: "ckBTC".to_string(),
        asset_type: WheelAssetType::Token {
            ledger_canister_id: Principal::from_text("mxzaz-hqaaa-aaaar-qaada-cai").unwrap(),
        },
        total_amount: 0,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        timestamps: TimestampFields::new(),
    }
}

pub fn cketh_wheel_asset() -> WheelAsset {
    WheelAsset {
        name: "ckETH".to_string(),
        asset_type: WheelAssetType::Token {
            ledger_canister_id: Principal::from_text("ss2fx-dyaaa-aaaar-qacoq-cai").unwrap(),
        },
        total_amount: 0,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        timestamps: TimestampFields::new(),
    }
}

pub fn ckusdc_wheel_asset() -> WheelAsset {
    WheelAsset {
        name: "ckUSDC".to_string(),
        asset_type: WheelAssetType::Token {
            ledger_canister_id: Principal::from_text("xevnm-gaaaa-aaaar-qafnq-cai").unwrap(),
        },
        total_amount: 0,
        used_amount: 0,
        state: WheelAssetState::Enabled,
        timestamps: TimestampFields::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use rstest::*;

    #[rstest]
    #[case::token(fixtures::wheel_asset_token())]
    #[case::gadget(fixtures::wheel_asset_gadget())]
    #[case::jackpot(fixtures::wheel_asset_jackpot())]
    fn storable_impl(#[case] wheel_asset: WheelAsset) {
        let serialized_wheel_asset = wheel_asset.to_bytes();
        let deserialized_wheel_asset = WheelAsset::from_bytes(serialized_wheel_asset);

        assert_eq!(wheel_asset, deserialized_wheel_asset);
    }

    #[rstest]
    #[case::token(fixtures::wheel_asset_token())]
    #[case::gadget(fixtures::wheel_asset_gadget())]
    #[case::jackpot(fixtures::wheel_asset_jackpot())]
    fn use_one(#[case] mut wheel_asset: WheelAsset) {
        const TOTAL_AMOUNT: u32 = 2;
        wheel_asset.total_amount = TOTAL_AMOUNT;
        wheel_asset.used_amount = 0;

        wheel_asset.use_one().unwrap();
        assert_eq!(wheel_asset.total_amount, TOTAL_AMOUNT);
        assert_eq!(wheel_asset.used_amount, 1);

        wheel_asset.use_one().unwrap();
        assert_eq!(wheel_asset.total_amount, TOTAL_AMOUNT);
        assert_eq!(wheel_asset.used_amount, 2);

        let err = wheel_asset.use_one().unwrap_err();
        assert_eq!(wheel_asset.total_amount, TOTAL_AMOUNT);
        assert_eq!(wheel_asset.used_amount, 2);
        assert_eq!(err.message(), "Asset out of stock");

        wheel_asset.total_amount = 0;
        let err = wheel_asset.use_one().unwrap_err();
        assert_eq!(wheel_asset.total_amount, 0);
        assert_eq!(err.message(), "Asset total amount is 0");
    }

    #[rstest]
    fn wheel_asset_state_key_storable_impl() {
        let state = WheelAssetState::Enabled;
        let wheel_asset_id = fixtures::uuid();

        let key = WheelAssetStateKey::new(state, wheel_asset_id).unwrap();

        let serialized_key = key.to_bytes();
        let deserialized_key = WheelAssetStateKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }
}
