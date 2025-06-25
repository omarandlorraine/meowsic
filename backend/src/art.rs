use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Art {
    pub name: String,
    pub url: String,
    pub path: PathBuf,
    pub splash: bool,
}

#[derive(Debug, Clone)]
pub struct Api {
    data_dir_path: PathBuf,
}

impl Api {
    pub fn new(data_dir_path: impl AsRef<Path>) -> Result<Self> {
        let data_dir_path = data_dir_path.as_ref().join("arts");

        fs::create_dir_all(&data_dir_path).map_err(|err| {
            anyhow!(
                "failed to create arts directory: {}. error: {err}",
                data_dir_path.display()
            )
        })?;

        Ok(Self { data_dir_path })
    }

    fn list_file_path(&self) -> PathBuf {
        self.data_dir_path.join("index.json")
    }

    pub fn get_list(&self) -> Result<Vec<Art>> {
        let path = self.list_file_path();

        let file = fs::File::open(&path).map_err(|err| {
            anyhow!(
                "failed to open art list file: {}. error: {err}",
                path.display()
            )
        })?;

        let mut data: Vec<Art> = serde_json::from_reader(file)?;

        for art in data.iter_mut() {
            if !art.path.is_absolute() {
                art.path = self.data_dir_path.join(&art.path);
            }
        }

        Ok(data)
    }
}
