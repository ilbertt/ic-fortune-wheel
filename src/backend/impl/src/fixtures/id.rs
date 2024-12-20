use crate::repositories::Uuid;
use candid::Principal;
use rstest::*;

#[fixture]
pub fn principal() -> Principal {
    Principal::from_slice(&[0])
}

#[fixture]
pub fn uuid() -> Uuid {
    Uuid::from_random_bytes([0; 16])
}

#[fixture]
pub fn uuid_a() -> Uuid {
    Uuid::try_from("1149d10b-cf9b-4e4c-9d3f-30d5ecc4928d").unwrap()
}

#[fixture]
pub fn uuid_b() -> Uuid {
    Uuid::try_from("fd83c44f-0892-4d3c-a619-10674346d338").unwrap()
}
