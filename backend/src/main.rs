// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod player;
mod tracks;
mod utils;

use anyhow::Result;
use db::Db;
use parking_lot::Mutex;
use player::Player;
use rodio::{OutputStream, Sink};
use serde::Serialize;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<()> {
    // ! DO NOT DROP _stream (don't assign to just '_')
    let (_stream, handle) = OutputStream::try_default()?;
    let sink = Sink::try_new(&handle)?;

    let player = Arc::new(Mutex::new(Player::new(sink)?));
    let db = Db::new("meowsic.db").await?;

    db.init().await?;

    let state = AppState { player, db };

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::player_set_queue,
            commands::player_goto,
            commands::player_next,
            commands::player_prev,
            commands::player_seek,
            commands::player_stop,
            commands::player_play,
            commands::player_pause,
            commands::player_set_current,
            commands::player_is_paused,
            commands::player_set_volume,
            commands::db_get_tracks,
            commands::db_get_playlists,
            commands::db_add_playlist,
            commands::db_rename_playlist,
            commands::db_remove_playlist,
            commands::db_get_playlist_tracks,
            commands::db_set_playlist_tracks,
            commands::db_scan_dirs,
            commands::db_get_dirs,
            commands::db_set_dirs,
        ])
        .run(tauri::generate_context!())?;

    Ok(())
}

struct AppState {
    player: Arc<Mutex<Player>>,
    db: Db,
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
