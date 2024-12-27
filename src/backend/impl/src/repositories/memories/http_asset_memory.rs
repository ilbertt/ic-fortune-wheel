use ic_stable_structures::BTreeMap;

use crate::repositories::{HttpAsset, HttpAssetPath};

use super::{Memory, HTTP_ASSETS_MEMORY_ID, MEMORY_MANAGER};

pub type HttpAssetMemory = BTreeMap<HttpAssetPath, HttpAsset, Memory>;

pub fn init_http_assets() -> HttpAssetMemory {
    HttpAssetMemory::init(get_http_assets_memory())
}

fn get_http_assets_memory() -> Memory {
    MEMORY_MANAGER.with(|memory_manager| memory_manager.borrow().get(HTTP_ASSETS_MEMORY_ID))
}
