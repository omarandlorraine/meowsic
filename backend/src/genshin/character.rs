use super::{Element, Quality};
use crate::utils::StrExt;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Character {
    pub name: String,
    pub element: Element,
    pub quality: Quality,
    pub ascension_materials: [String; 10], // only ref to names
    pub talent_upgrade_materials: [String; 9], // only ref to names
    pub outfits: Vec<String>,
    pub media: Media<String>,
}

impl Character {
    pub fn new(
        name: impl Into<String>,
        element: Element,
        quality: impl Into<Quality>,
        ascension_materials: [impl Into<String>; 10],
        talent_upgrade_materials: [impl Into<String>; 9],
        outfits: Vec<impl Into<String>>,
        media: Media<String>,
    ) -> Self {
        let quality: Quality = quality.into();
        assert!((4..=5).contains(&quality.value()), "quality must be 4 or 5");

        Self {
            name: name.into(),
            element,
            quality,
            ascension_materials: ascension_materials.map(Into::into),
            talent_upgrade_materials: talent_upgrade_materials.map(Into::into),
            outfits: outfits.into_iter().map(Into::into).collect(),
            media,
        }
    }

    pub fn id(&self) -> String {
        id(&self.name)
    }

    pub fn local_media(&self, base_path: impl AsRef<Path>) -> Media<PathBuf> {
        let id = self.id();
        let base_path = base_path.as_ref().join(&id);

        Media {
            icon: base_path.join("icon.png"),
            cards: (1..(self.media.cards.len() + 1))
                .map(|i| base_path.join(format!("card-{i}.png")))
                .collect(),
            splashes: (1..(self.media.splashes.len() + 1))
                .map(|i| base_path.join(format!("splash-{i}.png")))
                .collect(),
        }
    }
}

pub fn id(name: impl AsRef<str>) -> String {
    name.as_ref().to_hash().to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Media<T> {
    pub icon: T,
    pub cards: Vec<T>,
    pub splashes: Vec<T>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterEntry {
    pub name: String,
    pub icon: String,
}

pub type CharacterList = BTreeMap<String, CharacterEntry>;
