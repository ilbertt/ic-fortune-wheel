use common_api::ApiError;
use fastrand::Rng;
use ic_cdk::api::management_canister::main::raw_rand;
use rand::prelude::*;
use rand_chacha::ChaCha20Rng;
use std::cell::RefCell;

thread_local! {
  static RNG: RefCell<Rng> = create_rng();
}

pub async fn chacha20_rng() -> Result<ChaCha20Rng, ApiError> {
    let seed: [u8; 32] = {
        let (seed,) = raw_rand().await.map_err(|(code, msg)| {
            ApiError::internal(&format!(
                "System API call to `raw_rand` failed: ({:?}) {}",
                code, msg
            ))
        })?;

        seed.try_into().map_err(|err| {
            ApiError::internal(&format!(
                "System API call to `raw_rand` did not return 32 bytes: ({:?})",
                err
            ))
        })
    }?;
    Ok(ChaCha20Rng::from_seed(seed))
}

fn create_rng() -> RefCell<Rng> {
    let seed = get_seed();
    let rng = Rng::with_seed(seed);

    RefCell::new(rng)
}

fn get_seed() -> u64 {
    #[cfg(target_family = "wasm")]
    {
        ic_cdk::api::time()
    }

    // fallback seed for non-wasm targets, e.g. unit tests
    #[cfg(not(target_family = "wasm"))]
    {
        0
    }
}

fn with_rng<T>(cb: impl FnOnce(&mut Rng) -> T) -> T {
    RNG.with_borrow_mut(cb)
}

pub fn with_random_bytes<const N: usize, T>(cb: impl FnOnce([u8; N]) -> T) -> T {
    with_rng(|rng| {
        let mut bytes = [0u8; N];
        rng.fill(&mut bytes);

        cb(bytes)
    })
}
