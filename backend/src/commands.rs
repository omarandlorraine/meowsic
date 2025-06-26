use crate::tracks::Track;
use crate::{AppState, Error};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub async fn get_tracks(state: State<AppState, '_>) -> Result<Vec<Track>, Error> {
    Ok(state.db.get_tracks().await?)
}

#[tauri::command]
pub fn player_set_queue(state: State<AppState, '_>, queue: Vec<PathBuf>) -> Result<(), Error> {
    let mut lock = state.player.lock();
    lock.set_queue(queue);

    Ok(())
}

#[tauri::command]
pub fn player_goto(state: State<AppState, '_>, index: usize) -> Result<(), Error> {
    let mut lock = state.player.lock();
    lock.goto(index)?;

    Ok(())
}

#[tauri::command]
pub fn player_play(state: State<AppState, '_>) -> Result<(), Error> {
    let lock = state.player.lock();
    lock.play();

    Ok(())
}

#[tauri::command]
pub fn player_pause(state: State<AppState, '_>) -> Result<(), Error> {
    let lock = state.player.lock();
    lock.pause();

    Ok(())
}
