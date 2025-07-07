import { invoke } from '@tauri-apps/api/core'
import { getAssetUrl } from '@/utils'
import type { Track } from '@/tracks'

// NOTE: haven't tested all the associated formats
// TODO: fix issue with context switching b/w players

export class BackendPlayer implements Player {
  associated = ['mp3', 'm4a', 'flac', 'wav', 'ogg', 'aac', 'opus', 'aiff']

  async goto(index: number) {
    await invoke('player_goto', { index })
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

  async stop() {
    await invoke('player_stop')
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
  associated = []

  player = new Audio()
  queue: string[] = []
  current = 0

  // constructor() {
  //   this.player.controls = true
  //   document.body.appendChild(this.player)
  // }

  load(src: string | null) {
    this.player.src = src ? getAssetUrl(src) : ''
    this.player.load()
  }

  async goto(index: number) {
    this.current = index
    this.load(this.queue[index])
  }

  seek(elapsed: number) {
    this.player.currentTime = elapsed
  }

  pause() {
    this.player.pause()
  }

  async play() {
    await this.player.play()
  }

  stop() {
    this.load(null)
  }

  setQueue(queue: Track[]) {
    this.queue = queue.map(t => t.path)
  }

  setCurrent(current: number) {
    this.current = current
  }

  setVolume(volume: number) {
    this.player.volume = volume
  }

  async getDuration() {
    return new Promise<number>(resolve => {
      const resolveData = () => resolve(Math.round(this.player.duration))

      if (!isNaN(this.player.duration)) return resolveData()
      this.player.addEventListener('loadedmetadata', resolveData, { once: true })
    })
  }
}

export type Player = {
  associated: string[]

  goto(index: number): Promise<void> | void
  seek(elapsed: number): Promise<void> | void
  pause(): Promise<void> | void
  play(): Promise<void> | void
  stop(): Promise<void> | void
  setVolume(volume: number): Promise<void> | void
  setQueue(queue: Track[]): Promise<void> | void
  setCurrent(current: number): Promise<void> | void
}
