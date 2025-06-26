// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod player;
mod tracks;
mod utils;

use anyhow::Result;
use db::Db;
use player::Player;
use rodio::{OutputStream, Sink};
use serde::Serialize;

#[tokio::main]
async fn main() -> Result<()> {
    // ! DO NOT DROP _stream (don't assign to just '_')
    let (_stream, handle) = OutputStream::try_default()?;
    let sink = Sink::try_new(&handle)?;

    let mut player = Player::new(sink)?;
    let db = Db::new("meowsic.db").await?;

    player.queue.push("test1.m4a".into());

    player.start();

    db.init().await?;
    db.set_dirs(&["D:/music"]).await?;
    let dirs = db.get_dirs().await?;
    db.scan(&dirs).await?;

    let state = AppState { player, db };

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![commands::play, commands::pause,])
        .run(tauri::generate_context!())?;

    Ok(())
}

struct AppState {
    player: Player,
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
