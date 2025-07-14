use crate::tracks::Track;
use anyhow::{Result, anyhow};
use rodio::{Decoder, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::time::Duration;

// ? TODO: send position to frontend

pub struct Player {
    sink: Sink,
    current: usize,
    pub queue: Vec<PathBuf>,
    pub arbitrary_tracks: Vec<Track>,
}

impl Player {
    pub fn new(sink: Sink) -> Result<Self> {
        sink.pause();

        Ok(Self {
            sink,
            current: 0,
            queue: vec![],
            arbitrary_tracks: vec![],
        })
    }

    pub fn goto(&mut self, index: usize) -> Result<()> {
        self.set_current(index)?;
        self.stop();

        self.sink.load(&self.queue[self.current])
    }

    pub fn seek(&self, elapsed: u64) -> Result<()> {
        self.sink
            .try_seek(Duration::from_secs(elapsed))
            .map_err(|err| anyhow!("{err}"))
    }

    pub fn stop(&self) {
        self.sink.stop();
    }

    pub fn play(&self) {
        self.sink.play();
    }

    pub fn pause(&self) {
        self.sink.pause();
    }

    pub fn set_queue(&mut self, queue: Vec<PathBuf>) {
        self.queue = queue;
    }

    pub fn set_current(&mut self, index: usize) -> Result<()> {
        // ? 0 is allowed as a valid default index
        // ? so bounds check can be > queue length
        if index > self.queue.len() {
            Err(anyhow!("Index out of bounds"))
        } else if index == self.current {
            Ok(())
        } else {
            self.current = index;
            Ok(())
        }
    }

    pub fn is_paused(&self) -> bool {
        self.sink.is_paused()
    }

    pub fn set_volume(&self, volume: f32) {
        self.sink.set_volume(volume);
    }

    // pub fn set_speed(&self, speed: f32) {
    //     self.sink.set_speed(speed);
    // }
}

pub struct ScrubPlayer {
    sink: Sink,
    current: Option<PathBuf>,
}

impl ScrubPlayer {
    pub fn new(sink: Sink) -> Result<Self> {
        sink.pause();

        Ok(Self {
            sink,
            current: None,
        })
    }

    pub fn start(&mut self) -> Result<()> {
        self.stop();

        if let Some(path) = &self.current {
            self.sink.load(path)
        } else {
            Err(anyhow!("No track selected"))
        }
    }

    pub fn seek(&self, elapsed: u64) -> Result<()> {
        self.sink
            .try_seek(Duration::from_secs(elapsed))
            .map_err(|err| anyhow!("{err}"))
    }

    pub fn set_current(&mut self, path: Option<PathBuf>) {
        self.current = path;
    }

    pub fn stop(&self) {
        self.sink.stop();
    }

    pub fn play(&self) {
        self.sink.play();
    }

    pub fn pause(&self) {
        self.sink.pause();
    }
}

trait SinkExt {
    fn load(&self, path: impl AsRef<Path>) -> Result<()>;
}

impl SinkExt for Sink {
    fn load(&self, path: impl AsRef<Path>) -> Result<()> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let source = Decoder::new(reader)?;

        self.append(source);

        Ok(())
    }
}
