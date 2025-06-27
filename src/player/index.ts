import { invoke } from '@tauri-apps/api/core'
import { createStore, useStore } from 'zustand'
import type { Track } from '@/tracks'

type Timeout = ReturnType<typeof setInterval>

type Store = {
  queue: Track[]
  current: number
  elapsed: number
  volume: number
  interval: Timeout | null
  isPaused: boolean
  looping: boolean
}

export const store = createStore<Store>(() => ({
  queue: [],
  current: 0,
  elapsed: 0,
  volume: 1,
  interval: null,
  isPaused: true,
  looping: false,
}))

async function setQueue(queue: Track[]) {
  await invoke('player_set_queue', { queue: queue.map(t => t.path) })

  const state = store.getState()
  invalidateInterval(state.interval)

  store.setState({ queue, current: 0, elapsed: 0, interval: null, isPaused: true })
}

// ! TODO: handle paused cases, handle looping

export async function goto(index: number) {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  await invoke('player_goto', { index })

  const interval = state.isPaused ? null : createInterval()
  store.setState({ current: index, elapsed: 0, interval })
}

export async function next() {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  await invoke('player_next')

  const interval = state.isPaused ? null : createInterval()
  store.setState(state => ({ current: state.current + 1, elapsed: 0, interval }))
}

export async function prev() {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  await invoke('player_prev')

  const interval = state.isPaused ? null : createInterval()
  store.setState(state => ({ current: state.current - 1, elapsed: 0, interval }))
}

export async function seek(elapsed: number) {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  let rounded = Math.floor(elapsed)
  await invoke('player_seek', { elapsed: rounded })

  const interval = state.isPaused ? null : createInterval()
  store.setState({ elapsed: rounded, interval })
}

export async function stop() {
  await invoke('player_stop')

  const state = store.getState()
  invalidateInterval(state.interval)

  store.setState({ elapsed: 0, interval: null, isPaused: true })
}

export async function pause() {
  const state = store.getState()
  if (state.isPaused) return

  invalidateInterval(state.interval)
  await invoke('player_pause')

  store.setState({ interval: null, isPaused: true })
}

export async function play() {
  const state = store.getState()
  if (!state.isPaused) return

  await invoke('player_play')
  const interval = createInterval()

  store.setState({ interval, isPaused: false })
}

export async function setVolume(volume: number) {
  await invoke('player_set_volume', { volume })

  store.setState({ volume })
}

function createInterval() {
  return setInterval(() => {
    const state = store.getState()
    const current = state.queue.at(state.current)

    if (!current) return stop()
    if (state.elapsed > current.duration) return next()

    store.setState(state => ({ elapsed: state.elapsed + 1 }))
  }, 1000)
}

function invalidateInterval(interval?: Timeout | null) {
  if (interval) clearInterval(interval)
}

export function usePlayer() {
  const { current, queue, elapsed, isPaused, looping } = useStore(store)

  const toggle = isPaused ? play : pause

  const hasNext = queue.length > current + 1
  const hasPrev = current > 0

  return {
    current: queue.at(current),
    queue,
    elapsed,
    isPaused,
    setQueue,
    stop,
    prev,
    next,
    goto,
    play,
    pause,
    seek,
    setVolume,
    toggle,
    hasNext,
    hasPrev,
    looping,
  }
}

export function normalizeMeta(track?: Track | null) {
  if (!track) return null

  let title = track.name
  let artist = ''
  let album = ''

  for (const [key, value] of Object.entries(track.tags)) {
    switch (key) {
      case 'TrackTitle':
        title = value
        break
      case 'Artist':
        artist = value
        break
      case 'Album':
        album = value
        break
    }
  }

  return { title, artist, album }
}
