#![deny(clippy::all)]

use ic_cdk::query;
use include_dir::{include_dir, Dir};

mod controllers;
mod mappings;
mod repositories;
mod services;
mod system_api;

#[cfg(test)]
mod fixtures;

static FRONTEND_ASSETS_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../../frontend/dist");

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> &'static str {
    include_str!("../../api/backend.did")
}

#[cfg(test)]
mod tests {
    use backend_api::*;
    use candid::export_service;
    use candid_parser::utils::{service_compatible, CandidSource};
    use ic_http_certification::{HttpRequest, HttpResponse};
    use std::path::Path;

    export_service!();

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
