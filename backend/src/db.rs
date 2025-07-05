use crate::tracks;
use crate::tracks::{Album, Track};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{Pool, QueryBuilder, Sqlite};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

pub struct Db {
    pool: Pool<Sqlite>,
    covers_path: PathBuf,
}

impl Db {
    pub fn new(path: impl AsRef<Path>, covers_path: PathBuf) -> Self {
        let options = SqliteConnectOptions::new()
            .filename(path)
            .create_if_missing(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_lazy_with(options);

        Self { pool, covers_path }
    }

    pub async fn get_tracks(&self, filters: &GetTracksFilters) -> Result<Vec<Track>> {
        let mut qb = QueryBuilder::new("SELECT * FROM tracks");
        let mut is_first_filter = true;

        if let Some(album) = &filters.album {
            qb.push(if is_first_filter { " WHERE " } else { " AND " })
                .push("album = ")
                .push_bind(album);
            is_first_filter = false;
        }

        if let Some(artist) = &filters.artist {
            qb.push(if is_first_filter { " WHERE " } else { " AND " })
                .push("artist = ")
                .push_bind(artist);
        }

        qb.push(" ORDER BY name ASC");

        let entries: Vec<TrackRow> = qb.build_query_as().fetch_all(&self.pool).await?;
        let tracks = entries.into_iter().map(Track::from).collect();

        // let multiplier = 10; // TEST large dataset -> upto 376832 tracks at 12x
        // let mut tracks: Vec<Track> = tracks;
        // for i in 0..multiplier {
        //     tracks.extend(tracks.clone().into_iter().enumerate().map(|(k, mut t)| {
        //         t.hash = format!("{}-{i}-{k}", t.hash);
        //         t
        //     }));
        // }

        Ok(tracks)
    }

    pub async fn scan_dirs(&self, dirs: &[impl AsRef<Path>]) -> Result<()> {
        let tracks = tracks::scan(&dirs, &self.covers_path)?;

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
        let names: Vec<String> = sqlx::query_scalar("SELECT name FROM playlists ORDER BY name ASC")
            .fetch_all(&self.pool)
            .await?;

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
                t.genre,
                pt.position
            FROM tracks AS t
            JOIN playlist_tracks AS pt ON pt.track_hash = t.hash
            WHERE pt.playlist_name = $1
            ORDER BY pt.position ASC
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

            let mut tx = self.pool.begin().await?;
            let name = name.as_ref();

            let mut qb: QueryBuilder<Sqlite> =
                QueryBuilder::new("DELETE FROM playlist_tracks WHERE playlist_name = ");

            qb.push_bind(name);
            qb.push(" AND track_hash IN (");
            let mut separated = qb.separated(", ");

            for hash in hashes.iter().take(32000) {
                separated.push_bind(hash.as_ref());
            }

            qb.push(")");
            qb.build().execute(&mut *tx).await?;

            sqlx::query(
                "
                WITH ordered AS (
                    SELECT track_hash, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_pos
                    FROM playlist_tracks
                    WHERE playlist_name = $1
                )
                UPDATE playlist_tracks
                SET position = (
                    SELECT new_pos FROM ordered WHERE ordered.track_hash = playlist_tracks.track_hash
                )
                WHERE playlist_name = $1
                ",
            )
            .bind(name)
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;
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

        let mut tx = self.pool.begin().await?;
        let name = name.as_ref();

        let max_pos: i64 = sqlx::query_scalar(
            "SELECT COALESCE(MAX(position), -1) FROM playlist_tracks WHERE playlist_name = $1",
        )
        .bind(name)
        .fetch_one(&mut *tx)
        .await?;

        let mut max_pos = max_pos + 1;

        let existing: Vec<String> =
            sqlx::query_scalar("SELECT track_hash FROM playlist_tracks WHERE playlist_name = $1")
                .bind(name)
                .fetch_all(&mut *tx)
                .await?;

        let existing: HashSet<String> = existing.into_iter().collect();

        let filtered: Vec<&str> = hashes
            .into_iter()
            .map(|x| x.as_ref())
            .filter(|&x| !existing.contains(x))
            .collect();

        if filtered.is_empty() {
            tx.commit().await?;

            return Ok(());
        }

        let mut qb =
            QueryBuilder::new("INSERT INTO playlist_tracks (playlist_name, track_hash, position) ");

        qb.push_values(filtered.into_iter().take(32000), |mut b, hash| {
            b.push_bind(name).push_bind(hash).push_bind(max_pos);
            max_pos += 1;
        });

        qb.build().execute(&mut *tx).await?;
        tx.commit().await?;

        Ok(())
    }

    pub async fn reorder_playlist_track(
        &self,
        name: impl AsRef<str>,
        hash: impl AsRef<str>,
        src: i64,
        dst: i64,
    ) -> Result<()> {
        let name = name.as_ref();

        let query = if dst < src {
            sqlx::query(
                "
                UPDATE playlist_tracks 
                SET position = position + 1
                WHERE playlist_name = $1 AND position >= $2 AND position < $3
                ",
            )
            .bind(name)
            .bind(dst)
            .bind(src)
        } else if dst > src {
            sqlx::query(
                "
                UPDATE playlist_tracks
                SET position = position - 1
                WHERE playlist_name = $1 AND position > $2 AND position <= $3
                ",
            )
            .bind(name)
            .bind(src)
            .bind(dst)
        } else {
            return Ok(());
        };

        let mut tx = self.pool.begin().await?;

        query.execute(&mut *tx).await?;

        sqlx::query(
            "
            UPDATE playlist_tracks
            SET position = $1
            WHERE playlist_name = $2 AND track_hash = $3
            ",
        )
        .bind(dst)
        .bind(name)
        .bind(hash.as_ref())
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(())
    }

    pub async fn get_emotions(&self) -> Result<Vec<Emotion>> {
        let names: Vec<Emotion> = sqlx::query_as("SELECT * FROM emotions ORDER BY rowid ASC")
            .fetch_all(&self.pool)
            .await?;

        Ok(names)
    }

    pub async fn get_emotion_tracks(&self, name: impl AsRef<str>) -> Result<Vec<Track>> {
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
                t.genre,
                et.rank
            FROM tracks AS t
            JOIN emotion_tracks AS et ON et.track_hash = t.hash
            WHERE et.emotion_name = $1
            ORDER BY et.rank DESC
            ",
        )
        .bind(name.as_ref())
        .fetch_all(&self.pool)
        .await?;

        let tracks = entries.into_iter().map(Track::from).collect();

        Ok(tracks)
    }

    pub async fn rank_up_emotion_track(
        &self,
        name: impl AsRef<str>,
        hash: impl AsRef<str>,
    ) -> Result<()> {
        sqlx::query(
            "
            INSERT INTO emotion_tracks (emotion_name, track_hash, rank) VALUES ($1, $2, 1)
            ON CONFLICT(emotion_name, track_hash)
                DO UPDATE SET rank = rank + 1
            ",
        )
        .bind(name.as_ref())
        .bind(hash.as_ref())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_albums(&self) -> Result<Vec<Album>> {
        let albums: Vec<Album> = sqlx::query_as(
            "
            SELECT album AS name, MIN(cover) AS cover
            FROM tracks
            WHERE album IS NOT NULL
            GROUP BY album
            ORDER BY album ASC
            ",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(albums)
    }

    pub async fn get_artists(&self) -> Result<Vec<String>> {
        let artists: Vec<String> = sqlx::query_scalar(
            "SELECT artist FROM tracks WHERE artist IS NOT NULL GROUP BY artist ORDER BY artist ASC",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(artists)
    }

    pub async fn get_dirs(&self) -> Result<Vec<String>> {
        let paths: Vec<String> = sqlx::query_scalar("SELECT path FROM dirs ORDER BY path ASC")
            .fetch_all(&self.pool)
            .await?;

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
        fs::create_dir_all(&self.covers_path)?;

        sqlx::query(include_str!("sql/init.sql"))
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
    #[sqlx(default)]
    pub position: Option<i64>,
    #[sqlx(default)]
    pub rank: Option<i64>,
}

#[derive(sqlx::FromRow, Debug, Serialize, Deserialize)]
pub struct Emotion {
    pub name: String,
    pub color: String,
    pub icon: String,
}

#[derive(Deserialize)]
pub struct GetTracksFilters {
    pub album: Option<String>,
    pub artist: Option<String>,
}
