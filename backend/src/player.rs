use anyhow::{Result, anyhow};
use rodio::{Decoder, Sink};
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::time::Duration;

pub struct Player {
    sink: Sink,
    current: usize,
    pub queue: Vec<PathBuf>,
    looping: bool,
}

impl Player {
    pub fn new(sink: Sink) -> Result<Self> {
        sink.pause();

        Ok(Self {
            sink,
            current: 0,
            queue: vec![],
            looping: false,
        })
    }

    fn load(&self) -> Result<()> {
        let file = File::open(&self.queue[self.current])?;
        let reader = BufReader::new(file);
        let source = Decoder::new(reader)?;

        self.sink.append(source);

        Ok(())
    }

    pub fn prev(&mut self) -> Result<()> {
        if self.current == 0 {
            if self.looping {
                self.current = self.queue.len() - 1;
            } else {
                return Ok(());
            }
        } else {
            self.current -= 1;
        }

        self.stop();
        self.load()?;

        Ok(())
    }

    pub fn next(&mut self) -> Result<()> {
        if self.current == self.queue.len() - 1 {
            if self.looping {
                self.current = 0;
            } else {
                return Ok(());
            }
        } else {
            self.current += 1;
        }

        self.stop();
        self.load()?;

        Ok(())
    }

    pub fn goto(&mut self, index: usize) -> Result<()> {
        if index >= self.queue.len() {
            return Err(anyhow!("Index out of bounds"));
        }

        self.current = index;
        self.stop();
        self.load()?;

        Ok(())
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
        self.current = 0;
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
