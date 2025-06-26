// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod player;
mod track;

use anyhow::Result;
use player::Player;
use rodio::{OutputStream, Sink};
use serde::Serialize;

use crate::track::Track;

#[tokio::main]
async fn main() -> Result<()> {
    // ! DO NOT DROP _stream (don't assign to just '_')
    let (_stream, handle) = OutputStream::try_default()?;
    let sink = Sink::try_new(&handle)?;
    let player = Player::new(sink)?;

    let state = AppState { player };

    let t = Track::new("test1.m4a")?;
    dbg!(&t.tags);
    let t = Track::new("test2.m4a")?;
    dbg!(&t.tags);
    let t = Track::new("test3.mp3")?;
    dbg!(&t.tags);
    let t = Track::new("test4.mp3")?;
    dbg!(&t.tags);

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
