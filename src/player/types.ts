import { invoke } from '@tauri-apps/api/core'
import { MediaPlayer } from '@/players'
import type { Track } from '@/tracks'

export class BackendPlayer implements Player {
  async goto(index: number) {
    await invoke('player_goto', { index })
  }

  async stop() {
    await invoke('player_stop')
    await this.pause()
  }

  async seek(elapsed: number) {
    await invoke('player_seek', { elapsed })
  }

  async pause() {
    await invoke('player_pause')
  }

  async play() {
    await invoke('player_play')
  }

  async setQueue(queue: Track[]) {
    await invoke('player_set_queue', { queue: queue.map(t => t.path) })
  }

  async setCurrent(current: number) {
    await invoke('player_set_current', { index: current })
  }

  async setVolume(volume: number) {
    await invoke('player_set_volume', { volume })
  }
}

export class WebPlayer implements Player {
  player: MediaPlayer
  queue: string[] = []
  current = 0

  constructor() {
    this.player = new MediaPlayer(new Audio())

    // DEBUG - show controls
    // this.player.controls = true
    // document.body.appendChild(this.player)
  }

  async goto(index: number) {
    this.current = index
    this.player.load(this.queue[index])
  }

  async stop() {
    this.player.load(null)
    await this.pause()
  }

  async seek(elapsed: number) {
    this.player.seek(elapsed)
  }

  async pause() {
    this.player.pause()
  }

  async play() {
    await this.player.play()
  }

  async setQueue(queue: Track[]) {
    this.queue = queue.map(t => t.path)
  }

  async setCurrent(current: number) {
    this.current = current
  }

  async setVolume(volume: number) {
    this.player.setVolume(volume)
  }

  async getDuration() {
    return await this.player.getDuration()
  }
}

export type Player = {
  goto(index: number): Promise<void>
  seek(elapsed: number): Promise<void>
  pause(): Promise<void>
  play(): Promise<void>
  stop(): Promise<void>
  setVolume(volume: number): Promise<void>
  setQueue(queue: Track[]): Promise<void>
  setCurrent(current: number): Promise<void>
}
