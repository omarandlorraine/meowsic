use super::Quality;
use crate::utils::StrExt;
use std::array;

#[derive(Debug, Clone)]
struct Material {
    pub name: String,
    pub quality: Quality,
    pub group: Option<Group>,
    pub subgroup: Option<String>, // store boss name instead of actual subgroup
    pub available_days: Option<[u8; 3]>,
    pub icon: String,
}

#[derive(Debug, Clone, Copy)]
pub enum Group {
    LocalSpecialty,
    NormalBossDrop,
    AscensionGem,
    GeneralEnemyDrop,
    EliteEnemyDrop,
    WeeklyBossDrop,
    TalentBook,
}

impl Material {
    pub fn new(
        name: impl Into<String>,
        quality: impl Into<Quality>,
        group: impl Into<Option<Group>>,
        subgroup: impl Into<Option<String>>,
        available_days: impl Into<Option<[u8; 3]>>,
        icon: impl Into<String>,
    ) -> Self {
        Self {
            name: name.into(),
            quality: quality.into(),
            group: group.into(),
            subgroup: subgroup.into(),
            available_days: available_days.into(),
            icon: icon.into(),
        }
    }

    pub fn local_icon(&self) -> String {
        format!("{}.png", self.name.to_hash())
    }

    pub fn general_enemy_drop(
        name: impl Into<String>,
        quality: impl Into<Quality>,
        subgroup: impl Into<String>,
        icon: impl Into<String>,
    ) -> Self {
        let quality: Quality = quality.into();
        assert!(quality.value() < 4, "quality must be less than 4");

        Self::new(
            name,
            quality,
            Group::GeneralEnemyDrop,
            subgroup.into(),
            None,
            icon,
        )
    }

    pub fn elite_enemy_drop(
        name: impl Into<String>,
        quality: impl Into<Quality>,
        subgroup: impl Into<String>,
        icon: impl Into<String>,
    ) -> Self {
        let quality: Quality = quality.into();
        assert!(quality.value() < 5, "quality must be less than 5");

        Self::new(
            name,
            quality,
            Group::EliteEnemyDrop,
            subgroup.into(),
            None,
            icon,
        )
    }

    pub fn talent_books(
        name: impl AsRef<str>,
        available_days: [u8; 3],
        icons: [impl AsRef<str>; 3],
    ) -> [Self; 3] {
        let prefixes = ["Teachings of", "Guide to", "Philosophies of"];
        let name = name.as_ref();

        array::from_fn(|i| {
            let subgroup = name.to_string();
            let name = format!("{} {name}", prefixes[i]);
            let icon = icons[i].as_ref();

            Self::new(
                name,
                i as u8 + 2,
                Group::TalentBook,
                subgroup,
                available_days,
                icon,
            )
        })
    }

    pub fn ascension_gems(name: impl AsRef<str>, icons: [impl AsRef<str>; 4]) -> [Self; 4] {
        let suffixes = ["Sliver", "Fragment", "Chunk", "Gemstone"];
        let name = name.as_ref();

        array::from_fn(|i| {
            let subgroup = name.to_string();
            let name = format!("{name} {}", suffixes[i]);
            let icon = icons[i].as_ref();

            Self::new(name, i as u8 + 2, Group::AscensionGem, subgroup, None, icon)
        })
    }

    pub fn local_specialty(name: impl Into<String>, icon: impl Into<String>) -> Self {
        Self::new(name, 1, Group::LocalSpecialty, None, None, icon)
    }

    pub fn normal_boss_drop(name: impl Into<String>, icon: impl Into<String>) -> Self {
        Self::new(name, 4, Group::NormalBossDrop, None, None, icon)
    }

    pub fn weekly_boss_drop(
        name: impl Into<String>,
        subgroup: impl Into<String>,
        icon: impl Into<String>,
    ) -> Self {
        Self::new(name, 5, Group::WeeklyBossDrop, subgroup.into(), None, icon)
    }

    pub fn crown_of_insight(icon: impl Into<String>) -> Self {
        Self::new("Crown of Insight", 5, None, None, None, icon)
    }

    pub fn mora(icon: impl Into<String>) -> Self {
        Self::new("Mora", 3, None, None, None, icon)
    }
}
