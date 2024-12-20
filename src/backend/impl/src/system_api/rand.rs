use backend_api::ApiError;
use rand::prelude::*;
use rand_chacha::ChaCha20Rng;
use std::cell::RefCell;

#[cfg(target_family = "wasm")]
use ic_cdk::api::management_canister::main::raw_rand;

thread_local! {
    static RNG: RefCell<Option<ChaCha20Rng>> = RefCell::new(None);
}

async fn with_rng<T>(cb: impl FnOnce(&mut ChaCha20Rng) -> T) -> Result<T, ApiError> {
    let is_init = RNG.with_borrow(|rng| rng.is_some());

    if !is_init {
        let seed = get_seed().await?;

        let rng = ChaCha20Rng::from_seed(seed);
        RNG.with(|option_rng| {
            option_rng.borrow_mut().get_or_insert(rng);
        });
    }

    RNG.with_borrow_mut(|rng| {
        let rng = rng
            .as_mut()
            .ok_or_else(|| ApiError::internal("Failed to initialize random number generator"))?;

        Ok(cb(rng))
    })
}

async fn get_seed() -> Result<[u8; 32], ApiError> {
    #[cfg(target_family = "wasm")]
    {
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
    }

    // fallback seed for non-wasm targets, e.g. unit tests
    #[cfg(not(target_family = "wasm"))]
    Ok([0u8; 32])
}

pub async fn with_random_bytes<const N: usize, T>(
    cb: impl FnOnce([u8; N]) -> T,
) -> Result<T, ApiError> {
    with_rng(|rng| {
        let mut bytes = [0u8; N];
        rng.fill_bytes(&mut bytes);

        cb(bytes)
    })
    .await
}
