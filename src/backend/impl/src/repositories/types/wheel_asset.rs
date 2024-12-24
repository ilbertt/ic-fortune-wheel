use std::{borrow::Cow, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{get_current_date_time, DateTime, TimestampFields, Timestamped, Uuid};

pub type WheelAssetId = Uuid;

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct WheelAssetTokenPrice {
    pub usd_price: f64,
    pub last_fetched_at: DateTime,
}

impl WheelAssetTokenPrice {
    pub fn new(usd_price: f64) -> Self {
        Self {
            usd_price,
            last_fetched_at: get_current_date_time(),
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub struct WheelAssetTokenBalance {
    pub balance: u128,
    pub last_fetched_at: DateTime,
}

impl WheelAssetTokenBalance {
    pub fn new(balance: u128) -> Self {
        Self {
            balance,
            last_fetched_at: get_current_date_time(),
        }
    }
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum WheelAssetType {
    Token {
        ledger_canister_id: Principal,
        // The symbol used to fetch the exchange rate against USD.
        exchange_rate_symbol: String,
        /// Whether the USD price should be fetched or not.
        should_fetch_usd_price: bool,
        /// The last fetched USD price, if any.
        usd_price: Option<WheelAssetTokenPrice>,
        /// The decimals that the token uses.
        decimals: u8,
        /// The last fetched token balance, if any.
        balance: Option<WheelAssetTokenBalance>,
    },
    Gadget,
    Jackpot,
}

impl From<&WheelAssetType> for u8 {
    fn from(asset_type: &WheelAssetType) -> u8 {
        match asset_type {
            WheelAssetType::Token { .. } => 1,
            WheelAssetType::Gadget => 2,
            WheelAssetType::Jackpot => 3,
        }
    }
}

impl WheelAssetType {
    pub fn empty_token() -> Self {
        WheelAssetType::Token {
            ledger_canister_id: Principal::from_slice(&[0]),
            exchange_rate_symbol: "".to_string(),
            should_fetch_usd_price: false,
            usd_price: None,
            decimals: 0,
            balance: None,
        }
    }

    pub fn set_latest_price(&mut self, input_usd_price: WheelAssetTokenPrice) {
        if let WheelAssetType::Token { usd_price, .. } = self {
            *usd_price = Some(input_usd_price);
        }
    }

    pub fn should_fetch_usd_price(&self) -> bool {
        match self {
            WheelAssetType::Token {
                should_fetch_usd_price,
                ..
            } => *should_fetch_usd_price,
            _ => false,
        }
    }

    pub fn set_latest_balance(&mut self, input_balance: WheelAssetTokenBalance) {
        if let WheelAssetType::Token { balance, .. } = self {
            *balance = Some(input_balance);
        }
    }
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

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
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

    pub fn set_latest_price(&mut self, input_usd_price: WheelAssetTokenPrice) {
        self.asset_type.set_latest_price(input_usd_price);
    }

    pub fn should_fetch_usd_price(&self) -> bool {
        self.asset_type.should_fetch_usd_price()
    }

    pub fn set_latest_balance(&mut self, input_balance: WheelAssetTokenBalance) {
        self.asset_type.set_latest_balance(input_balance);
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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct WheelAssetTypeKey(Blob<{ Self::MAX_SIZE as usize }>);

impl WheelAssetTypeKey {
    const MAX_SIZE: u32 = <(u8, WheelAssetId)>::BOUND.max_size();

    pub fn new(
        asset_type: &WheelAssetType,
        wheel_asset_id: WheelAssetId,
    ) -> Result<Self, ApiError> {
        Ok(Self(
            Blob::try_from((u8::from(asset_type), wheel_asset_id).to_bytes().as_ref()).map_err(
                |_| {
                    ApiError::internal(&format!(
                        "Failed to convert asset type {:?}, wheel asset id {:?} to bytes.",
                        asset_type, wheel_asset_id
                    ))
                },
            )?,
        ))
    }
}

impl Storable for WheelAssetTypeKey {
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

pub struct WheelAssetTypeRange {
    start_bound: WheelAssetTypeKey,
    end_bound: WheelAssetTypeKey,
}

impl WheelAssetTypeRange {
    pub fn new(asset_type: &WheelAssetType) -> Result<Self, ApiError> {
        Ok(Self {
            start_bound: WheelAssetTypeKey::new(asset_type, Uuid::MIN)?,
            end_bound: WheelAssetTypeKey::new(asset_type, Uuid::MAX)?,
        })
    }
}

impl RangeBounds<WheelAssetTypeKey> for WheelAssetTypeRange {
    fn start_bound(&self) -> std::ops::Bound<&WheelAssetTypeKey> {
        std::ops::Bound::Included(&self.start_bound)
    }

    fn end_bound(&self) -> std::ops::Bound<&WheelAssetTypeKey> {
        std::ops::Bound::Included(&self.end_bound)
    }
}

pub fn icp_wheel_asset() -> WheelAsset {
    WheelAsset {
        name: "ICP".to_string(),
        asset_type: WheelAssetType::Token {
            ledger_canister_id: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
            exchange_rate_symbol: "ICP".to_string(),
            should_fetch_usd_price: true,
            usd_price: None,
            decimals: 8,
            balance: None,
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
            exchange_rate_symbol: "BTC".to_string(),
            should_fetch_usd_price: true,
            usd_price: None,
            decimals: 8,
            balance: None,
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
            exchange_rate_symbol: "ETH".to_string(),
            should_fetch_usd_price: true,
            usd_price: None,
            decimals: 18,
            balance: None,
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
            exchange_rate_symbol: "USDC".to_string(),
            should_fetch_usd_price: false,
            usd_price: Some(WheelAssetTokenPrice::new(1.0)),
            decimals: 6,
            balance: None,
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

    #[rstest]
    #[case::token(fixtures::wheel_asset_token())]
    #[case::gadget(fixtures::wheel_asset_gadget())]
    #[case::jackpot(fixtures::wheel_asset_jackpot())]
    fn wheel_asset_type_key_storable_impl(#[case] wheel_asset: WheelAsset) {
        let asset_type = wheel_asset.asset_type;
        let wheel_asset_id = fixtures::uuid();

        let key = WheelAssetTypeKey::new(&asset_type, wheel_asset_id).unwrap();

        let serialized_key = key.to_bytes();
        let deserialized_key = WheelAssetTypeKey::from_bytes(serialized_key);

        assert_eq!(key, deserialized_key);
    }

    #[rstest]
    #[case::icp(icp_wheel_asset())]
    #[case::ckbtc(ckbtc_wheel_asset())]
    #[case::cketh(cketh_wheel_asset())]
    #[case::ckusdc(ckusdc_wheel_asset())]
    fn wheel_asset_type_set_latest_price(#[case] mut wheel_asset: WheelAsset) {
        let usd_price = WheelAssetTokenPrice::new(42.42);
        wheel_asset.set_latest_price(usd_price.clone());
        let new_usd_price = match wheel_asset.asset_type {
            WheelAssetType::Token { usd_price, .. } => usd_price.unwrap(),
            _ => unreachable!(),
        };
        assert_eq!(new_usd_price.usd_price, 42.42);
    }

    #[rstest]
    #[case::icp(icp_wheel_asset())]
    #[case::ckbtc(ckbtc_wheel_asset())]
    #[case::cketh(cketh_wheel_asset())]
    #[case::ckusdc(ckusdc_wheel_asset())]
    fn wheel_asset_type_set_latest_balance(#[case] mut wheel_asset: WheelAsset) {
        let balance = WheelAssetTokenBalance::new(42);
        wheel_asset.set_latest_balance(balance.clone());
        let new_balance = match wheel_asset.asset_type {
            WheelAssetType::Token { balance, .. } => balance.unwrap(),
            _ => unreachable!(),
        };
        assert_eq!(new_balance.balance, 42);
    }
}
