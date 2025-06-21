use std::str::FromStr;

use candid::Principal;
use ic_cdk::call::{Call, CallResult};
use ic_xrc_types::{GetExchangeRateRequest, GetExchangeRateResult};

const XRC_API_CYCLES_COST: u128 = 1_000_000_000;

pub struct ExchangeRateCanisterService(pub Principal);

impl Default for ExchangeRateCanisterService {
    fn default() -> Self {
        Self(Principal::from_str("uf6dk-hyaaa-aaaaq-qaaaq-cai").unwrap())
    }
}

impl ExchangeRateCanisterService {
    pub async fn get_exchange_rate(
        &self,
        arg0: GetExchangeRateRequest,
    ) -> CallResult<GetExchangeRateResult> {
        let (res,) = Call::unbounded_wait(self.0, "get_exchange_rate")
            .with_arg(arg0)
            .with_cycles(XRC_API_CYCLES_COST)
            .await?
            .candid_tuple()?;
        Ok(res)
    }
}
