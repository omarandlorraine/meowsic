use crate::tracks;
use crate::tracks::Track;
use anyhow::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::types::Json;
use sqlx::{Pool, QueryBuilder, Sqlite};
use std::collections::HashMap;
use std::path::Path;

pub struct Db {
    pool: Pool<Sqlite>,
}

impl Db {
    pub async fn new(path: impl AsRef<Path>) -> Result<Self> {
        let options = SqliteConnectOptions::new()
            .filename(path)
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await?;

        Ok(Self { pool })
    }

    pub async fn get_tracks(&self) -> Result<Vec<Track>> {
        let entries: Vec<TrackRow> = sqlx::query_as("SELECT * FROM tracks")
            .fetch_all(&self.pool)
            .await?;

        let tracks = entries.into_iter().map(Track::from).collect();

        Ok(tracks)
    }

    pub async fn scan_dirs(&self, dirs: &[impl AsRef<Path>]) -> Result<()> {
        let tracks = tracks::scan(&dirs)?;

        let mut qb = QueryBuilder::new(
            "INSERT INTO tracks (hash, path, name, extension, duration, cover, tags) ",
        );

        qb.push_values(tracks.into_iter().take(32000), |mut b, track| {
            b.push_bind(track.hash)
                .push_bind(track.path.to_string_lossy().to_string())
                .push_bind(track.name)
                .push_bind(track.extension)
                .push_bind(track.duration)
                .push_bind(track.cover.map(|p| p.to_string_lossy().to_string()))
                .push_bind(serde_json::to_string(&track.tags).unwrap_or_default());
        });

        let mut tx = self.pool.begin().await?;
        qb.build().execute(&mut *tx).await?;
        tx.commit().await?;

        Ok(())
    }

    pub async fn get_dirs(&self) -> Result<Vec<String>> {
        let entries: Vec<(String,)> = sqlx::query_as("SELECT * FROM dirs")
            .fetch_all(&self.pool)
            .await?;

        let paths = entries.into_iter().map(|x| x.0).collect();

        Ok(paths)
    }

    pub async fn set_dirs(&self, paths: &[impl AsRef<str>]) -> Result<()> {
        let mut tx = self.pool.begin().await?;
        sqlx::query("DELETE FROM dirs").execute(&mut *tx).await?;

        for path in paths {
            sqlx::query("INSERT INTO dirs (path) VALUES ($1)")
                .bind(path.as_ref())
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;

        Ok(())
    }

    pub async fn init(&self) -> Result<()> {
        sqlx::query(
            "
            CREATE TABLE IF NOT EXISTS dirs (                
                path    TEXT PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS tracks (                
                hash        TEXT PRIMARY KEY,
                path        TEXT NOT NULL,
                name        TEXT NOT NULL,
                extension   TEXT NOT NULL,
                duration    REAL NOT NULL,
                cover       TEXT,
                tags        BLOB
            );
            ",
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}

#[derive(sqlx::FromRow)]
pub struct TrackRow {
    pub hash: String,
    pub path: String,
    pub name: String,
    pub extension: String,
    pub duration: f64,
    pub cover: Option<String>,
    pub tags: Json<HashMap<String, String>>,
}
