use crate::repositories::Uuid;
use candid::Principal;
use rstest::*;

#[fixture]
pub fn principal() -> Principal {
    Principal::from_slice(&[0])
}

#[fixture]
pub fn uuid() -> Uuid {
    Uuid::from_random_bytes([0; 10])
}

#[fixture]
pub fn uuid_a() -> Uuid {
    Uuid::try_from("0194e545-73b6-7cdc-9310-09fc095155d0").unwrap()
}

#[fixture]
pub fn uuid_b() -> Uuid {
    Uuid::try_from("0194e547-afdb-7585-b899-f9e2bb3552e3").unwrap()
}
