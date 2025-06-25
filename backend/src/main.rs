// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod art;
mod genshin;
mod utils;

use anyhow::{Result, anyhow};
use art::Api as ArtApi;
use genshin::api::Api as GenshinApi;
use genshin::handlers::{
    genshin_character_id, genshin_get_character_list, genshin_get_local_character,
    genshin_save_character,
};
use serde::Serialize;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<()> {
    let data_dir_path = if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../data")
    } else {
        let exe_path = std::env::current_exe()?;
        exe_path.parent().map(|x| x.join("data")).ok_or_else(|| {
            anyhow!(
                "failed to get parent directory of executable: {}",
                exe_path.display()
            )
        })?
    };

    let genshin_api = GenshinApi::new(data_dir_path.clone())?;
    let art_api = ArtApi::new(data_dir_path.clone())?;

    let state = AppState {
        data_dir_path,
        genshin_api,
        art_api,
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            genshin_get_character_list,
            genshin_get_local_character,
            genshin_save_character,
            genshin_character_id
        ])
        .run(tauri::generate_context!())?;

    Ok(())
}

#[derive(Debug, Clone)]
struct AppState {
    data_dir_path: PathBuf,
    genshin_api: GenshinApi,
    art_api: ArtApi,
}

#[derive(Debug, Clone, Serialize)]
struct Error {
    message: String,
}

impl From<anyhow::Error> for Error {
    fn from(err: anyhow::Error) -> Self {
        Self {
            message: err.to_string(),
        }
    }
}
