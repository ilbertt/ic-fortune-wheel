use std::{borrow::Cow, ops::RangeBounds};

use backend_api::ApiError;
use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::{
    storable::{Blob, Bound},
    Storable,
};

use super::{get_current_date_time, DateTime, HttpAssetPath, TimestampFields, Timestamped, Uuid};

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
pub struct WheelAssetTokenLedgerConfig {
    pub ledger_canister_id: Principal,
    pub decimals: u8,
}

#[derive(Debug, CandidType, Deserialize, Clone, PartialEq)]
pub enum WheelAssetType {
    Token {
        ledger_config: WheelAssetTokenLedgerConfig,
        /// The symbol used to fetch the exchange rate against USD.
        /// If not provided, the USD price will not be fetched.
        exchange_rate_symbol: Option<String>,
        /// The last fetched USD price, if any.
        usd_price: Option<WheelAssetTokenPrice>,
        /// The last fetched token balance, if any.
        balance: Option<WheelAssetTokenBalance>,
        /// The amount of USD to be paid per prize.
        prize_usd_amount: f64,
    },
    Gadget {
        article_type: Option<String>,
    },
    Jackpot,
}

impl From<&WheelAssetType> for u8 {
    fn from(asset_type: &WheelAssetType) -> u8 {
        match asset_type {
            WheelAssetType::Token { .. } => 1,
            WheelAssetType::Gadget { .. } => 2,
            WheelAssetType::Jackpot => 3,
        }
    }
}

impl WheelAssetType {
    pub fn empty_token() -> Self {
        WheelAssetType::Token {
            ledger_config: WheelAssetTokenLedgerConfig {
                ledger_canister_id: Principal::from_slice(&[0]),
                decimals: 0,
            },
            exchange_rate_symbol: None,
            usd_price: None,
            balance: None,
            prize_usd_amount: 0.0,
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
                exchange_rate_symbol,
                ..
            } => exchange_rate_symbol.is_some(),
            _ => false,
        }
    }

    pub fn set_latest_balance(&mut self, input_balance: WheelAssetTokenBalance) {
        if let WheelAssetType::Token { balance, .. } = self {
            *balance = Some(input_balance);
        }
    }

    fn token_balance(&self) -> f64 {
        match self {
            WheelAssetType::Token {
                balance,
                ledger_config,
                ..
            } => balance
                .as_ref()
                .map(|el| ((el.balance as f64) / 10f64.powi(ledger_config.decimals as i32)))
                .unwrap_or(0f64),
            _ => 0f64,
        }
    }

    fn token_total_usd_amount(&self) -> f64 {
        let balance = self.token_balance();
        match self {
            WheelAssetType::Token { usd_price, .. } => {
                balance * usd_price.as_ref().map(|el| el.usd_price).unwrap_or(0f64)
            }
            _ => 0f64,
        }
    }

    pub fn available_draws_count(&self) -> u32 {
        if let WheelAssetType::Token {
            prize_usd_amount, ..
        } = self
        {
            let total_usd_amount = self.token_total_usd_amount();

            (total_usd_amount / prize_usd_amount).trunc() as u32
        } else {
            0
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
    pub wheel_image_path: Option<HttpAssetPath>,
    pub modal_image_path: Option<HttpAssetPath>,
    pub timestamps: TimestampFields,
}

impl WheelAsset {
    pub fn new_enabled(name: String, asset_type: WheelAssetType, total_amount: u32) -> Self {
        Self {
            name,
            asset_type,
            total_amount,
            used_amount: 0,
            state: WheelAssetState::Enabled,
            wheel_image_path: None,
            modal_image_path: None,
            timestamps: TimestampFields::new(),
        }
    }

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

    pub fn set_latest_balance(&mut self, input_balance: WheelAssetTokenBalance) {
        self.asset_type.set_latest_balance(input_balance);
    }

    pub fn is_token(&self) -> bool {
        matches!(self.asset_type, WheelAssetType::Token { .. })
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
            start_bound: WheelAssetStateKey::new(state, Uuid::min())?,
            end_bound: WheelAssetStateKey::new(state, Uuid::max())?,
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
            start_bound: WheelAssetTypeKey::new(asset_type, Uuid::min())?,
            end_bound: WheelAssetTypeKey::new(asset_type, Uuid::max())?,
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

pub fn icp_wheel_asset() -> (WheelAsset, Vec<u8>) {
    (
        WheelAsset {
            name: "ICP".to_string(),
            asset_type: WheelAssetType::Token {
                ledger_config: WheelAssetTokenLedgerConfig {
                    ledger_canister_id: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai")
                        .unwrap(),
                    decimals: 8,
                },
                exchange_rate_symbol: Some("ICP".to_string()),
                usd_price: None,
                balance: None,
                prize_usd_amount: 1.0,
            },
            total_amount: 0,
            used_amount: 0,
            state: WheelAssetState::Enabled,
            wheel_image_path: None,
            modal_image_path: None,
            timestamps: TimestampFields::new(),
        },
        include_bytes!("../../static/images/tokens/icp.png").to_vec(),
    )
}

pub fn ckbtc_wheel_asset() -> (WheelAsset, Vec<u8>) {
    (
        WheelAsset {
            name: "ckBTC".to_string(),
            asset_type: WheelAssetType::Token {
                ledger_config: WheelAssetTokenLedgerConfig {
                    ledger_canister_id: Principal::from_text("mxzaz-hqaaa-aaaar-qaada-cai")
                        .unwrap(),
                    decimals: 8,
                },
                exchange_rate_symbol: Some("BTC".to_string()),
                usd_price: None,
                balance: None,
                prize_usd_amount: 1.0,
            },
            total_amount: 0,
            used_amount: 0,
            state: WheelAssetState::Enabled,
            wheel_image_path: None,
            modal_image_path: None,
            timestamps: TimestampFields::new(),
        },
        include_bytes!("../../static/images/tokens/ckbtc.png").to_vec(),
    )
}

pub fn cketh_wheel_asset() -> (WheelAsset, Vec<u8>) {
    (
        WheelAsset {
            name: "ckETH".to_string(),
            asset_type: WheelAssetType::Token {
                ledger_config: WheelAssetTokenLedgerConfig {
                    ledger_canister_id: Principal::from_text("ss2fx-dyaaa-aaaar-qacoq-cai")
                        .unwrap(),
                    decimals: 18,
                },
                exchange_rate_symbol: Some("ETH".to_string()),
                usd_price: None,
                balance: None,
                prize_usd_amount: 1.0,
            },
            total_amount: 0,
            used_amount: 0,
            state: WheelAssetState::Enabled,
            wheel_image_path: None,
            modal_image_path: None,
            timestamps: TimestampFields::new(),
        },
        include_bytes!("../../static/images/tokens/cketh.png").to_vec(),
    )
}

pub fn ckusdc_wheel_asset() -> (WheelAsset, Vec<u8>) {
    (
        WheelAsset {
            name: "ckUSDC".to_string(),
            asset_type: WheelAssetType::Token {
                ledger_config: WheelAssetTokenLedgerConfig {
                    ledger_canister_id: Principal::from_text("xevnm-gaaaa-aaaar-qafnq-cai")
                        .unwrap(),
                    decimals: 6,
                },
                exchange_rate_symbol: None,
                usd_price: Some(WheelAssetTokenPrice::new(1.0)),
                balance: None,
                prize_usd_amount: 1.0,
            },
            total_amount: 0,
            used_amount: 0,
            state: WheelAssetState::Enabled,
            wheel_image_path: None,
            modal_image_path: None,
            timestamps: TimestampFields::new(),
        },
        include_bytes!("../../static/images/tokens/ckusdc.png").to_vec(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixtures;
    use fixtures::{wheel_asset_gadget, wheel_asset_jackpot, wheel_asset_token};
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
    fn wheel_asset_type_set_latest_price(#[case] (mut wheel_asset, _): (WheelAsset, Vec<u8>)) {
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
    fn wheel_asset_type_set_latest_balance(#[case] (mut wheel_asset, _): (WheelAsset, Vec<u8>)) {
        let balance = WheelAssetTokenBalance::new(42);
        wheel_asset.set_latest_balance(balance.clone());
        let new_balance = match wheel_asset.asset_type {
            WheelAssetType::Token { balance, .. } => balance.unwrap(),
            _ => unreachable!(),
        };
        assert_eq!(new_balance.balance, 42);
    }

    #[rstest]
    #[case::token((wheel_asset_token(), true))]
    #[case::gadget((wheel_asset_gadget(), false))]
    #[case::jackpot((wheel_asset_jackpot(), false))]
    fn wheel_asset_is_token(#[case] (wheel_asset, expected_is_token): (WheelAsset, bool)) {
        assert_eq!(wheel_asset.is_token(), expected_is_token);
    }

    #[rstest]
    #[case((100_000_000, 8, 1.0, 1.0, 1))]
    #[case((100_000_000, 8, 1.9, 1.0, 1))]
    #[case((100_000_000, 8, 2.5, 1.0, 2))]
    #[case((10_000_000, 8, 1.0, 1.0, 0))]
    #[case((1_000_000_000, 8, 10.1, 10.0, 10))]
    #[case((100_000_000, 8, 1.3, 0.5, 2))]
    #[case((200_000_000, 6, 1.0, 1.0, 200))]
    fn available_draws_count_token(
        #[case] (
            initial_balance,
            initial_decimals,
            initial_usd_price,
            initial_prize_usd_amount,
            expected_draws,
        ): (u128, u8, f64, f64, u32),
    ) {
        let mut wheel_asset = wheel_asset_token();
        wheel_asset.set_latest_balance(WheelAssetTokenBalance::new(initial_balance));
        wheel_asset.set_latest_price(WheelAssetTokenPrice::new(initial_usd_price));
        match &mut wheel_asset.asset_type {
            WheelAssetType::Token {
                ledger_config,
                prize_usd_amount,
                ..
            } => {
                ledger_config.decimals = initial_decimals;
                *prize_usd_amount = initial_prize_usd_amount;
            }
            _ => unreachable!(),
        };
        assert_eq!(
            wheel_asset.asset_type.available_draws_count(),
            expected_draws
        );
    }

    #[rstest]
    #[case::gadget(wheel_asset_gadget())]
    #[case::jackpot(wheel_asset_jackpot())]
    fn available_draws_count_others(#[case] wheel_asset: WheelAsset) {
        assert_eq!(wheel_asset.asset_type.available_draws_count(), 0);
    }
}
