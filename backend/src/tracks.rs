use crate::db::TrackRow;
use crate::utils;
use anyhow::{Context, Result};
use serde::Serialize;
use std::fmt::Debug;
use std::fs;
use std::path::{Path, PathBuf};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey, StandardVisualKey};
use symphonia::core::probe::Hint;
use symphonia::default::get_probe;
use walkdir::WalkDir;

#[derive(Debug, Default, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub hash: String,
    pub path: PathBuf,
    pub name: String,
    pub extension: String,
    pub duration: u64,
    pub cover: Option<PathBuf>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,
    pub date: Option<String>,
    pub genre: Option<String>,
}

impl Track {
    pub fn new(path: impl Into<PathBuf>, covers_path: impl AsRef<Path>) -> Result<Self> {
        let path: PathBuf = path.into();
        let file = fs::File::open(&path)?;

        let extension = path
            .extension()
            .and_then(|x| x.to_str())
            .map(|x| x.to_string())
            .context("missing file extension")?;

        let file_name = path
            .file_name()
            .and_then(|x| x.to_str())
            .map(|x| x.to_string())
            .context("missing file name")?;

        let name = file_name
            .trim_end_matches(&format!(".{extension}"))
            .to_string();

        let hash = utils::hash(&file_name);

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
            path,
            name,
            extension,
            hash: hash.to_string(),
            ..Self::default()
        };

        if let Some(track) = probed.format.default_track() {
            if let Some((num_frames, sample_rate)) = track
                .codec_params
                .n_frames
                .zip(track.codec_params.sample_rate)
            {
                data.duration = num_frames / sample_rate as u64;
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
                        use StandardTagKey::*;

                        match key {
                            TrackTitle => data.title = Some(tag.value.to_string()),
                            Artist => data.artist = Some(tag.value.to_string()),
                            Album => data.album = Some(tag.value.to_string()),
                            AlbumArtist => data.album_artist = Some(tag.value.to_string()),
                            Date => data.date = Some(tag.value.to_string()),
                            Genre => data.genre = Some(tag.value.to_string()),
                            _ => {}
                        }
                    }
                }

                for entry in rev.visuals() {
                    if let Some(key) = entry.usage {
                        if matches!(key, StandardVisualKey::FrontCover) {
                            let (_, ext) =
                                entry.media_type.split_once("/").unwrap_or(("image", "jpg"));
                            let path = covers_path.as_ref().join(format!("{hash}.{ext}"));

                            fs::write(&path, &entry.data)?;
                            data.cover = Some(path);
                        }
                    }
                }
            }
        }

        Ok(data)
    }
}

pub fn scan(dirs: &[impl AsRef<Path>]) -> Result<Vec<Track>> {
    let mut tracks = Vec::new();

    for dir in dirs {
        let covers_path = dir.as_ref().join("meowsic-covers");
        fs::create_dir_all(&covers_path)?;

        for entry in WalkDir::new(dir)
            .into_iter()
            .filter_map(|x| x.ok())
            .filter(|x| x.file_type().is_file())
        {
            if let Ok(track) = Track::new(entry.path(), &covers_path) {
                tracks.push(track);
            }
        }
    }

    Ok(tracks)
}

impl From<TrackRow> for Track {
    fn from(row: TrackRow) -> Self {
        Self {
            hash: row.hash,
            path: PathBuf::from(row.path),
            name: row.name,
            extension: row.extension,
            duration: row.duration.try_into().unwrap_or_default(),
            cover: row.cover.map(PathBuf::from),
            title: row.title,
            artist: row.artist,
            album: row.album,
            album_artist: row.album_artist,
            date: row.date,
            genre: row.genre,
        }
    }
}

// pub fn scan(dirs: &[impl AsRef<Path>], mut tracks: Vec<Track>) -> Result<Vec<Track>> {
//     let dirs = dirs.iter().map(|x| x.as_ref()).collect::<Vec<_>>();
//     let mut subdirs = vec![];

//     for dir in dirs {
//         for entry in fs::read_dir(dir)? {
//             let path = entry?.path();

//             if path.is_file() {
//                 tracks.push(Track::new(path)?);
//             } else if path.is_dir() {
//                 subdirs.push(path);
//             }
//         }
//     }

//     if subdirs.is_empty() {
//         Ok(tracks)
//     } else {
//         scan(&subdirs, tracks)
//     }
// }
