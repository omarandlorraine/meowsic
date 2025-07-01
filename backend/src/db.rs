use crate::tracks;
use crate::tracks::Track;
use anyhow::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Pool, QueryBuilder, Sqlite};
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

        // let multiplier = 10; // TEST large dataset -> upto 376832 tracks at 12x
        // let mut tracks: Vec<Track> = tracks;
        // for _ in 0..multiplier {
        //     tracks.extend(tracks.clone().into_iter());
        // }

        Ok(tracks)
    }

    pub async fn scan_dirs(&self, dirs: &[impl AsRef<Path>]) -> Result<()> {
        let tracks = tracks::scan(&dirs)?;

        let mut qb = QueryBuilder::new(
            "INSERT INTO tracks 
            (hash, path, name, extension, duration, cover, title, artist, album, album_artist, date, genre) ",
        );

        qb.push_values(tracks.into_iter().take(32000), |mut b, track| {
            b.push_bind(track.hash)
                .push_bind(track.path.to_string_lossy().to_string())
                .push_bind(track.name)
                .push_bind(track.extension)
                .push_bind(track.duration as i64)
                .push_bind(track.cover.map(|p| p.to_string_lossy().to_string()))
                .push_bind(track.title)
                .push_bind(track.artist)
                .push_bind(track.album)
                .push_bind(track.album_artist)
                .push_bind(track.date)
                .push_bind(track.genre);
        });

        let mut tx = self.pool.begin().await?;

        sqlx::query("DELETE FROM tracks").execute(&mut *tx).await?;
        qb.build().execute(&mut *tx).await?;
        tx.commit().await?;

        Ok(())
    }

    pub async fn get_playlists(&self) -> Result<Vec<String>> {
        let entries: Vec<(String,)> = sqlx::query_as("SELECT * FROM playlists")
            .fetch_all(&self.pool)
            .await?;

        let names = entries.into_iter().map(|x| x.0).collect();

        Ok(names)
    }

    // not using drop and insert because of cascading delete
    pub async fn add_playlist(&self, name: impl AsRef<str>) -> Result<()> {
        sqlx::query("INSERT INTO playlists (name) VALUES ($1)")
            .bind(name.as_ref())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn rename_playlist(
        &self,
        name: impl AsRef<str>,
        new_name: impl AsRef<str>,
    ) -> Result<()> {
        sqlx::query("UPDATE playlists SET name = $1 WHERE name = $2")
            .bind(new_name.as_ref())
            .bind(name.as_ref())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn remove_playlist(&self, name: impl AsRef<str>) -> Result<()> {
        sqlx::query("DELETE FROM playlists WHERE name = $1")
            .bind(name.as_ref())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_playlist_tracks(&self, name: impl AsRef<str>) -> Result<Vec<Track>> {
        let entries: Vec<TrackRow> = sqlx::query_as(
            "
            SELECT
                t.hash,
                t.path,
                t.name,
                t.extension,
                t.duration,
                t.cover,
                t.title,
                t.artist,
                t.album,
                t.album_artist,
                t.date,
                t.genre
            FROM tracks AS t
            JOIN playlist_tracks AS pt ON pt.track_hash = t.hash
            WHERE pt.playlist_name = $1
            ",
        )
        .bind(name.as_ref())
        .fetch_all(&self.pool)
        .await?;

        let tracks = entries.into_iter().map(Track::from).collect();

        Ok(tracks)
    }

    pub async fn remove_playlist_tracks(
        &self,
        name: impl AsRef<str>,
        hashes: Option<&[impl AsRef<str>]>,
    ) -> Result<()> {
        if let Some(hashes) = hashes {
            if hashes.is_empty() {
                return Ok(());
            }

            let mut qb: QueryBuilder<Sqlite> =
                QueryBuilder::new("DELETE FROM playlist_tracks WHERE playlist_name = ");

            qb.push_bind(name.as_ref());
            qb.push(" AND track_hash IN (");
            let mut separated = qb.separated(", ");

            for hash in hashes.iter().take(32000) {
                separated.push_bind(hash.as_ref());
            }

            qb.push(")");
            qb.build().execute(&self.pool).await?;
        } else {
            sqlx::query("DELETE FROM playlist_tracks WHERE playlist_name = $1")
                .bind(name.as_ref())
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    pub async fn add_playlist_tracks(
        &self,
        name: impl AsRef<str>,
        hashes: &[impl AsRef<str>],
    ) -> Result<()> {
        if hashes.is_empty() {
            return Ok(());
        }

        let mut qb =
            QueryBuilder::new("INSERT OR IGNORE INTO playlist_tracks (playlist_name, track_hash) ");

        qb.push_values(hashes.into_iter().take(32000), |mut b, hash| {
            b.push_bind(name.as_ref()).push_bind(hash.as_ref());
        });

        qb.build().execute(&self.pool).await?;

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
                path    TEXT    PRIMARY KEY
            );

            CREATE TABLE IF NOT EXISTS tracks (                
                hash            TEXT        PRIMARY KEY,
                path            TEXT        NOT NULL,
                name            TEXT        NOT NULL,
                extension       TEXT        NOT NULL,
                duration        INTEGER     NOT NULL,
                cover           TEXT,
                title           TEXT,
                artist          TEXT,
                album           TEXT,
                album_artist    TEXT,
                date            TEXT,
                genre           TEXT
            );

            CREATE TABLE IF NOT EXISTS playlists (
                name    TEXT    PRIMARY KEY                
            );

            CREATE TABLE IF NOT EXISTS playlist_tracks (
                playlist_name   TEXT        NOT NULL,
                track_hash      TEXT        NOT NULL,
                position        INTEGER     NOT NULL,

                PRIMARY KEY (playlist_name, track_hash),
                FOREIGN KEY (playlist_name) REFERENCES playlists(name)
                    ON DELETE CASCADE ON UPDATE CASCADE
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
    pub duration: i64,
    pub cover: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,
    pub date: Option<String>,
    pub genre: Option<String>,
}
