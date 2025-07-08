import { invoke } from '@tauri-apps/api/core'
import { getAssetUrl } from '@/utils'
import type { Track } from '@/tracks'

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
    await this.pause()
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
  error: Error | null = null

  queue: string[] = []
  current = 0

  constructor() {
    this.player.addEventListener('error', () => {
      this.error = normalizeMediaError(this.player.error)
    })

    // DEBUG - show controls
    // this.player.controls = true
    // document.body.appendChild(this.player)
  }

  load(src: string | null) {
    this.player.src = src ? getAssetUrl(src) : ''
    this.player.load()
  }

  async goto(index: number) {
    this.current = index
    this.load(this.queue[index])
  }

  async seek(elapsed: number) {
    this.player.currentTime = elapsed
  }

  async pause() {
    this.player.pause()
  }

  async play() {
    await this.player.play()
  }

  async stop() {
    this.load(null)
    await this.pause()
  }

  async setQueue(queue: Track[]) {
    this.queue = queue.map(t => t.path)
  }

  async setCurrent(current: number) {
    this.current = current
  }

  async setVolume(volume: number) {
    this.player.volume = volume
  }

  async getDuration() {
    return new Promise<number>((resolve, reject) => {
      const resolveData = () => resolve(Math.round(this.player.duration))
      if (!isNaN(this.player.duration)) return resolveData()

      this.player.addEventListener('loadedmetadata', resolveData, { once: true })
      this.player.addEventListener('error', () => reject(normalizeMediaError(this.player.error)), { once: true })
    })
  }
}

function normalizeMediaError(error: MediaError | null) {
  switch (error?.code) {
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return new Error('Media source not supported or found')
    case MediaError.MEDIA_ERR_ABORTED:
      return new Error('Playback aborted')
    case MediaError.MEDIA_ERR_NETWORK:
      return new Error('Network error')
    case MediaError.MEDIA_ERR_DECODE:
      return new Error('Decoding error')
    default:
      return new Error('Unknown error')
  }
}

export type Player = {
  associated: string[]

  goto(index: number): Promise<void>
  seek(elapsed: number): Promise<void>
  pause(): Promise<void>
  play(): Promise<void>
  stop(): Promise<void>
  setVolume(volume: number): Promise<void>
  setQueue(queue: Track[]): Promise<void>
  setCurrent(current: number): Promise<void>
}
