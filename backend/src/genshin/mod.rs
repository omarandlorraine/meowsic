pub mod api;
pub mod character;
pub mod handlers;

use anyhow::anyhow;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct Quality(u8);

impl Quality {
    pub fn new(value: u8) -> Self {
        assert!((1..=5).contains(&value), "quality must be between 1 and 5");
        Self(value)
    }

    pub fn value(&self) -> u8 {
        self.0
    }
}

// TODO: make it TryFrom
impl From<u8> for Quality {
    fn from(value: u8) -> Self {
        Self::new(value)
    }
}

impl std::fmt::Display for Quality {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} Star", self.0)?;
        if self.0 > 1 {
            write!(f, "s")?;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize)]
pub enum Element {
    Pyro,
    Hydro,
    Cryo,
    Electro,
    Anemo,
    Geo,
    Dendro,
}

impl TryFrom<&str> for Element {
    type Error = anyhow::Error;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value.to_lowercase().as_str() {
            "pyro" => Ok(Element::Pyro),
            "hydro" => Ok(Element::Hydro),
            "cryo" => Ok(Element::Cryo),
            "electro" => Ok(Element::Electro),
            "anemo" => Ok(Element::Anemo),
            "geo" => Ok(Element::Geo),
            "dendro" => Ok(Element::Dendro),
            _ => Err(anyhow!("unknown element: {value}")),
        }
    }
}

impl TryFrom<String> for Element {
    type Error = anyhow::Error;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        value.as_str().try_into()
    }
}

impl std::fmt::Display for Element {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Element::Pyro => write!(f, "Pyro"),
            Element::Hydro => write!(f, "Hydro"),
            Element::Cryo => write!(f, "Cryo"),
            Element::Electro => write!(f, "Electro"),
            Element::Anemo => write!(f, "Anemo"),
            Element::Geo => write!(f, "Geo"),
            Element::Dendro => write!(f, "Dendro"),
        }
    }
}
