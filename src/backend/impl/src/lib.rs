#![deny(clippy::all)]

use backend_api::*;
use candid::export_service;
use ic_cdk::*;

mod controllers;
mod mappings;
mod repositories;
mod services;
mod system_api;

#[cfg(test)]
mod fixtures;

export_service!();
#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid_parser::utils::{service_compatible, CandidSource};
    use std::path::Path;

    #[test]
    fn check_candid_interface() {
        let new_interface = __export_service();

        service_compatible(
            CandidSource::Text(&new_interface),
            CandidSource::File(Path::new("../api/backend.did")),
        )
        .unwrap();
    }
}
