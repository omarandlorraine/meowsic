import { createStore, useStore } from 'zustand'
import { addToast } from '@heroui/react'
import { Interval } from '@/utils'
import { BackendPlayer, WebPlayer } from '@/scrub-player/types'
import type { Track } from '@/tracks'
import type { Player } from '@/scrub-player/types'

const backendPlayer = new BackendPlayer()
const webPlayer = new WebPlayer()
const interval = new Interval(1000, onElapsed)

function initialState(): Store {
  return { current: null, elapsed: 0, isPaused: true, player: backendPlayer }
}

export const store = createStore<Store>(initialState)

// NOTE: if not paused, invalidate the interval and create a new one
// TODO: test any issues with context switching b/w players

// NOTE: shallow copy of the track can cause reference comparison issue
export async function start({ ...track }: Track, using?: Player) {
  const state = store.getState()
  if (!state.isPaused) interval.stop()

  const player = using ?? backendPlayer

  // case: stop the previous player
  if (player !== state.player) state.player.stop()

  try {
    await player.start()
    if (!state.isPaused) interval.start()

    try {
      // case: replace with metadata from the web player
      if (player instanceof WebPlayer) {
        const duration = await player.getDuration()
        track.duration = duration
      }

      // case: continue the playback if the player is not paused while navigating
      if (!state.isPaused) await player.play()
    } catch (err) {
      interval.stop()
      throw err
    }

    store.setState({ current: track, elapsed: 0, error: null, player })
  } catch (err) {
    console.error(err, track)

    // case: fallback to web player once if backend fails
    if (!using) return await start(track, webPlayer)

    const error = err as Error // since backend response have similar type
    store.setState({ current: track, elapsed: 0, error })

    addToast({ timeout: 5000, title: 'Track', description: error.message, color: 'danger' })
  }
}

export async function seek(elapsed: number) {
  const state = store.getState()

  if (!state.isPaused) interval.stop()
  await state.player.seek(elapsed)
  if (!state.isPaused) interval.start()

  store.setState({ elapsed })
}

export async function pause() {
  const state = store.getState()
  if (state.isPaused || state.error) return

  interval.stop()
  await state.player.pause()

  store.setState({ isPaused: true })
}

export async function play() {
  const state = store.getState()
  if (!state.isPaused || state.error) return

  await state.player.play()
  interval.start()

  store.setState({ isPaused: false })
}

export async function reset() {
  await setCurrent(null)
  await stop()

  interval.stop()
  store.setState(initialState())
}

function onElapsed() {
  const state = store.getState()
  const current = state.current

  if (!current) return reset()

  if (state.elapsed >= current.duration) {
    // we can pause and start instead of stop and start ?
    // since the track is already loaded ?
    return pause().then(() => start(current))
  }

  store.setState(state => ({ elapsed: state.elapsed + 1 }))
}

async function stop() {
  await backendPlayer.stop()
  await webPlayer.stop()
}

async function setCurrent(track: Track | null) {
  const path = track?.path ?? null

  await backendPlayer.setCurrent(path)
  await webPlayer.setCurrent(path)
}

export function useScrubPlayer() {
  const state = useStore(store)

  return {
    setState: store.setState,
    togglePlay: state.isPaused ? play : pause,
    current: state.current,
    isPaused: state.isPaused,
    elapsed: state.elapsed,
    error: state.error,
    setCurrent,
    reset,
    pause,
    start,
    seek,
    stop,
    play,
  }
}

export type Store = {
  current: Track | null
  elapsed: number
  isPaused: boolean
  error?: Error | null
  player: Player
}
