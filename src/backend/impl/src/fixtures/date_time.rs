use crate::repositories::DateTime;
use chrono::{FixedOffset, NaiveDate, TimeZone, Utc};
use rstest::*;

const HOUR: i32 = 3600;

#[fixture]
pub fn date_time_a() -> DateTime {
    let tz = FixedOffset::east_opt(5 * HOUR).unwrap();
    let date_time = NaiveDate::from_ymd_opt(2021, 12, 4)
        .unwrap()
        .and_hms_opt(10, 20, 6)
        .unwrap()
        .and_local_timezone(tz)
        .unwrap()
        .naive_local();

    DateTime::new(Utc.from_local_datetime(&date_time).unwrap()).unwrap()
}

#[fixture]
pub fn date_time_b() -> DateTime {
    let tz = FixedOffset::west_opt(8 * HOUR).unwrap();
    let date_time = NaiveDate::from_ymd_opt(2014, 4, 12)
        .unwrap()
        .and_hms_opt(18, 20, 53)
        .unwrap()
        .and_local_timezone(tz)
        .unwrap()
        .naive_local();

    DateTime::new(Utc.from_local_datetime(&date_time).unwrap()).unwrap()
}

#[fixture]
pub fn date_time_c() -> DateTime {
    let date_time = NaiveDate::from_ymd_opt(1998, 8, 22)
        .unwrap()
        .and_hms_opt(21, 49, 36)
        .unwrap()
        .and_utc();

    DateTime::new(date_time).unwrap()
}

#[fixture]
pub fn date_time_future() -> DateTime {
    let date_time = NaiveDate::from_ymd_opt(2100, 8, 22)
        .unwrap()
        .and_hms_opt(21, 49, 36)
        .unwrap()
        .and_utc();

    DateTime::new(date_time).unwrap()
}
