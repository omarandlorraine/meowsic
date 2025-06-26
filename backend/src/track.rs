use anyhow::{Context, Result};
use serde::Serialize;
use std::collections::HashMap;
use std::fmt::Debug;
use std::fs;
use std::path::PathBuf;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardVisualKey};
use symphonia::core::probe::Hint;
use symphonia::default::get_probe;

#[derive(Debug, Serialize)]
pub struct Track {
    pub id: String,
    pub path: PathBuf,
    pub name: String,
    pub extension: String,
    pub duration: f64,
    pub tags: HashMap<String, String>,
    pub visuals: HashMap<String, Vec<u8>>,
}

impl Track {
    pub fn new(path: impl Into<PathBuf>) -> Result<Self> {
        let path: PathBuf = path.into();
        let file = fs::File::open(&path)?;

        let extension = path
            .extension()
            .and_then(|x| x.to_str())
            .map(|x| x.to_string())
            .context("missing file extension")?;

        let id = path
            .file_name()
            .and_then(|x| x.to_str())
            .map(|x| x.to_string())
            .context("missing file name")?;

        let name = id.trim_end_matches(&format!(".{extension}")).to_string();

        let mss = MediaSourceStream::new(Box::new(file), Default::default());
        let mut hint = Hint::new();
        hint.with_extension(&extension);

        let mut probed = get_probe().format(
            &hint,
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )?;

        let mut data = Self {
            id,
            path,
            name,
            extension,
            duration: 0.0,
            tags: HashMap::new(),
            visuals: HashMap::new(),
        };

        if let Some(track) = probed.format.default_track() {
            if let Some((num_frames, sample_rate)) = track
                .codec_params
                .n_frames
                .zip(track.codec_params.sample_rate)
            {
                data.duration = num_frames as f64 / sample_rate as f64;
            }
        }

        if let Some(mut meta) = probed
            .metadata
            .get()
            .or_else(|| Some(probed.format.metadata()))
        {
            if let Some(rev) = meta.skip_to_latest() {
                for tag in rev.tags() {
                    if let Some(key) = tag.std_key {
                        data.tags.insert(format!("{key:?}"), tag.value.to_string());
                    }
                }

                for entry in rev.visuals() {
                    if let Some(key) = entry.usage {
                        if matches!(key, StandardVisualKey::FrontCover) {
                            data.visuals.insert(format!("{key:?}"), entry.data.to_vec());
                        }
                    }
                }
            }
        }

        Ok(data)
    }
}
