import { invoke } from '@tauri-apps/api/core'
import { MediaPlayer } from '@/players'

export class BackendPlayer implements Player {
  async start() {
    await invoke('scrub_player_start')
  }

  async setCurrent(path: string | null) {
    await invoke('scrub_player_set_current', { path })
  }

  async seek(elapsed: number) {
    await invoke('scrub_player_seek', { elapsed })
  }

  async pause() {
    await invoke('scrub_player_pause')
  }

  async play() {
    await invoke('scrub_player_play')
  }

  async stop() {
    await invoke('scrub_player_stop')
    await this.pause()
  }
}

export class WebPlayer implements Player {
  player: MediaPlayer
  current: string | null = null

  constructor() {
    this.player = new MediaPlayer(new Audio())

    // DEBUG - show controls
    // this.player.controls = true
    // document.body.appendChild(this.player)
  }

  async start() {
    this.player.load(this.current)
  }

  async setCurrent(path: string | null) {
    this.current = path
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

  async stop() {
    this.player.load(null)
    await this.pause()
  }

  async getDuration() {
    return await this.player.getDuration()
  }
}

export type Player = {
  start(): Promise<void>
  setCurrent(path: string | null): Promise<void>
  seek(elapsed: number): Promise<void>
  pause(): Promise<void>
  play(): Promise<void>
  stop(): Promise<void>
}
