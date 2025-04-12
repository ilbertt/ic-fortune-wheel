use std::str::FromStr;

use candid::Principal;
use ic_cdk::{api::call::call_with_payment, println};
use ic_xrc_types::{ExchangeRateError, GetExchangeRateRequest, GetExchangeRateResult, OtherError};

const XRC_API_CYCLES_COST: u64 = 1_000_000_000;

pub struct ExchangeRateCanisterService(pub Principal);

impl Default for ExchangeRateCanisterService {
    fn default() -> Self {
        Self(Principal::from_str("uf6dk-hyaaa-aaaaq-qaaaq-cai").unwrap())
    }
}

impl ExchangeRateCanisterService {
    pub async fn get_exchange_rate(&self, arg0: GetExchangeRateRequest) -> GetExchangeRateResult {
        call_with_payment::<(GetExchangeRateRequest,), (GetExchangeRateResult,)>(
            self.0,
            "get_exchange_rate",
            (arg0,),
            XRC_API_CYCLES_COST,
        )
        .await
        .map_err(|(code, message)| {
            // map the inter-canister call error to the ExchangeRateError
            println!(
                "Error: xrc: get_exchange_rate: call_with_payment: ({:?}) {}",
                code, message
            );
            ExchangeRateError::Other(OtherError {
                code: code as u32,
                description: message,
            })
        })
        .and_then(|result| result.0)
    }
}
