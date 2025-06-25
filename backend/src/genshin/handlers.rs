use super::character::id as character_id;
use super::character::{Character, CharacterList, Media as CharacterMedia};
use crate::{AppState, Error};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub async fn genshin_get_character_list(
    state: State<AppState, '_>,
) -> Result<CharacterList, Error> {
    Ok(state.genshin_api.get_character_list().await?)
}

#[tauri::command]
pub fn genshin_get_local_character(
    state: State<AppState, '_>,
    name: String,
) -> Result<(Character, CharacterMedia<PathBuf>), Error> {
    let character = state.genshin_api.get_local_character(name)?;
    let local_media = character.local_media(state.genshin_api.characters_dir_path());

    Ok((character, local_media))
}

#[tauri::command]
pub async fn genshin_save_character(state: State<AppState, '_>, name: String) -> Result<(), Error> {
    state.genshin_api.save_character(name).await?;
    Ok(())
}

#[tauri::command]
pub fn genshin_character_id(name: String) -> String {
    character_id(name)
}
