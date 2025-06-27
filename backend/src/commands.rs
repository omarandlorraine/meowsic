use crate::tracks::Track;
use crate::{AppState, Error};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn player_set_queue(state: State<AppState, '_>, queue: Vec<PathBuf>) -> Result<(), Error> {
    Ok(state.player.lock().set_queue(queue))
}

#[tauri::command]
pub fn player_goto(state: State<AppState, '_>, index: usize) -> Result<(), Error> {
    Ok(state.player.lock().goto(index)?)
}

#[tauri::command]
pub fn player_next(state: State<AppState, '_>) -> Result<(), Error> {
    Ok(state.player.lock().next()?)
}

#[tauri::command]
pub fn player_prev(state: State<AppState, '_>) -> Result<(), Error> {
    Ok(state.player.lock().prev()?)
}

#[tauri::command]
pub fn player_seek(state: State<AppState, '_>, elapsed: u64) -> Result<(), Error> {
    Ok(state.player.lock().seek(elapsed)?)
}

#[tauri::command]
pub fn player_stop(state: State<AppState, '_>) -> Result<(), Error> {
    Ok(state.player.lock().stop())
}

#[tauri::command]
pub fn player_play(state: State<AppState, '_>) -> Result<(), Error> {
    Ok(state.player.lock().play())
}

#[tauri::command]
pub fn player_pause(state: State<AppState, '_>) -> Result<(), Error> {
    Ok(state.player.lock().pause())
}

#[tauri::command]
pub fn player_is_paused(state: State<AppState, '_>) -> Result<bool, Error> {
    Ok(state.player.lock().is_paused())
}

#[tauri::command]
pub fn player_set_volume(state: State<AppState, '_>, volume: f32) -> Result<(), Error> {
    Ok(state.player.lock().set_volume(volume))
}

#[tauri::command]
pub async fn db_get_tracks(state: State<AppState, '_>) -> Result<Vec<Track>, Error> {
    Ok(state.db.get_tracks().await?)
}
