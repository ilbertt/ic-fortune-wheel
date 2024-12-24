use crate::{
    repositories::UserProfileRepositoryImpl,
    services::{InitService, InitServiceImpl},
};
use backend_api::ApiError;
use candid::Principal;
use ic_cdk::{caller, init, post_upgrade, pre_upgrade, println, spawn};
use ic_cdk_timers::set_timer;
use std::time::Duration;

#[init]
fn init() {
    let calling_principal = caller();

    set_timer(Duration::from_secs(0), move || {
        spawn(init_admin(calling_principal))
    });

    jobs::start_jobs();

    println!("init:done");
}

#[pre_upgrade]
fn pre_upgrade() {
    println!("pre_upgrade:done");
}

#[post_upgrade]
fn post_upgrade() {
    let calling_principal = caller();

    set_timer(Duration::from_secs(0), move || {
        spawn(init_admin(calling_principal))
    });

    jobs::start_jobs();

    println!("post_upgrade:done");
}

async fn init_admin(calling_principal: Principal) {
    if let Err(err) = InitController::default().init(calling_principal).await {
        ic_cdk::trap(&format!("Failed to initialize canister: {:?}", err));
    }
    println!("Initialization complete");
}

struct InitController<T: InitService> {
    init_service: T,
}

impl Default for InitController<InitServiceImpl<UserProfileRepositoryImpl>> {
    fn default() -> Self {
        Self::new(InitServiceImpl::default())
    }
}

impl<T: InitService> InitController<T> {
    fn new(init_service: T) -> Self {
        Self { init_service }
    }

    async fn init(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.init_service.init(calling_principal).await
    }
}

mod jobs {
    use ic_cdk::println;
    use ic_cdk_timers::set_timer_interval;
    use std::time::Duration;

    /// Starts all cron jobs.
    pub fn start_jobs() {
        wheel_assets::start();

        println!("jobs: Jobs started");
    }

    mod wheel_assets {
        use super::*;
        use ic_cdk::println;

        use crate::controllers::wheel_asset_controller::WheelAssetController;

        pub fn start() {
            set_timer_interval(Duration::from_secs(3_600), || {
                if let Err(err) = WheelAssetController::default().fetch_tokens_data_job() {
                    println!("wheel_assets: Failed to fetch token data: {}", err);
                }
            });
        }
    }
}
