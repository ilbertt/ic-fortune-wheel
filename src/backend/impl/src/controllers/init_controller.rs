use crate::{
    repositories::{HttpAssetRepositoryImpl, UserProfileRepositoryImpl},
    services::{HttpAssetService, HttpAssetServiceImpl, InitService, InitServiceImpl},
};
use backend_api::ApiError;
use candid::Principal;
use ic_cdk::{caller, init, post_upgrade, pre_upgrade, println, spawn};
use ic_cdk_timers::set_timer;
use std::time::Duration;

#[init]
fn init() {
    let calling_principal = caller();

    InitController::default().init(calling_principal);
}

#[pre_upgrade]
fn pre_upgrade() {
    InitController::default().pre_upgrade();
}

#[post_upgrade]
fn post_upgrade() {
    let calling_principal = caller();

    InitController::default().post_upgrade(calling_principal);
}

fn spawn_init_admin(calling_principal: Principal) {
    set_timer(Duration::from_secs(0), move || {
        spawn(async move {
            if let Err(err) = InitController::default()
                .init_admin(calling_principal)
                .await
            {
                ic_cdk::trap(&format!("Failed to initialize admins: {:?}", err));
            }
            println!("Admins initialized");
        })
    });
}

struct InitController<I: InitService, H: HttpAssetService> {
    init_service: I,
    http_asset_service: H,
}

impl Default
    for InitController<
        InitServiceImpl<UserProfileRepositoryImpl>,
        HttpAssetServiceImpl<HttpAssetRepositoryImpl>,
    >
{
    fn default() -> Self {
        Self::new(InitServiceImpl::default(), HttpAssetServiceImpl::default())
    }
}

impl<I: InitService, H: HttpAssetService> InitController<I, H> {
    fn new(init_service: I, http_asset_service: H) -> Self {
        Self {
            init_service,
            http_asset_service,
        }
    }

    async fn init_admin(&self, calling_principal: Principal) -> Result<(), ApiError> {
        self.init_service.init(calling_principal).await
    }

    fn init(&self, calling_principal: Principal) {
        self.internal_init(calling_principal);

        println!("init:done");
    }

    fn pre_upgrade(&self) {
        println!("pre_upgrade:done");
    }

    fn post_upgrade(&self, calling_principal: Principal) {
        self.internal_init(calling_principal);

        println!("post_upgrade:done");
    }

    fn internal_init(&self, calling_principal: Principal) {
        spawn_init_admin(calling_principal);

        match self.http_asset_service.init() {
            Ok(_) => println!("init: http_asset_service initialized"),
            Err(err) => {
                ic_cdk::trap(&format!("Failed to initialize http_asset_service: {}", err));
            }
        };

        jobs::start_jobs();
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

            println!("jobs:wheel_assets: Job started");
        }
    }
}
