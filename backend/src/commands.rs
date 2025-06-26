use crate::{AppState, Error};
use tauri::State;

#[tauri::command]
pub fn play(state: State<AppState, '_>) -> Result<(), Error> {
    state.player.play();
    Ok(())
}

#[tauri::command]
pub fn pause(state: State<AppState, '_>) -> Result<(), Error> {
    state.player.pause();
    Ok(())
}
