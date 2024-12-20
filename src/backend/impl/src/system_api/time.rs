use backend_api::ApiError;

pub fn get_date_time() -> Result<chrono::DateTime<chrono::Utc>, ApiError> {
    #[cfg(target_family = "wasm")]
    let date_time = {
        static NS_PER_S: u64 = 1_000_000_000;

        let timestamp_ns = ic_cdk::api::time();
        let timestamp_s: i64 = (timestamp_ns / NS_PER_S).try_into().map_err(|_| {
            ApiError::internal(&format!(
                "Failed to convert timestamp {} from nanoseconds to seconds",
                timestamp_ns
            ))
        })?;

        chrono::DateTime::from_timestamp(timestamp_s, 0).ok_or_else(|| {
            ApiError::internal(&format!(
                "Failed to convert timestamp {} to DateTime",
                timestamp_s
            ))
        })?
    };

    #[cfg(not(target_family = "wasm"))]
    let date_time = {
        use chrono::{TimeZone, Utc};

        Utc.with_ymd_and_hms(2021, 5, 10, 0, 0, 0).unwrap()
    };

    Ok(date_time)
}
