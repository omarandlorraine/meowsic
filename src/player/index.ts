import { createStore, useStore } from 'zustand'
import type { Track } from '@/tracks'
import { invoke } from '@tauri-apps/api/core'

type Store = {
  queue: Track[]
  current: number
  elapsed: number
  interval: ReturnType<typeof setInterval> | null
  isPaused: boolean
}

export const store = createStore<Store>(() => ({
  queue: [],
  current: 0,
  elapsed: 0,
  interval: null,
  isPaused: true,
}))

async function setQueue(queue: Track[]) {
  await invoke('player_set_queue', { queue: queue.map(t => t.path) })
  const state = store.getState()
  if (state.interval) clearInterval(state.interval)
  store.setState({ queue, current: 0, elapsed: 0, interval: null, isPaused: true })
}

function createInterval() {
  return setInterval(() => {
    const state = store.getState()
    const current = state.queue[state.current] // can be undefined

    if (Math.ceil(current.duration) === state.elapsed) {
      if (state.interval) clearInterval(state.interval)
      return next()
    }

    // ! TODO: EDGE CASE
    // if (!state.current) {
    //   if (state.interval) clearInterval(state.interval)
    //   return { elapsed: 0, interval: null }
    // }

    store.setState(state => ({ elapsed: state.elapsed + 1 }))
  }, 1000)
}

export async function goto(index: number) {
  await invoke('player_goto', { index })
  const interval = createInterval()
  store.setState({ current: index, elapsed: 0, interval, isPaused: false })
}

export async function next() {
  await invoke('player_next')
  const interval = createInterval()

  store.setState(state => ({
    current: state.current + 1,
    elapsed: 0,
    interval,
    isPaused: false,
  }))
}

export async function pause() {
  const state = store.getState()
  if (state.isPaused) return
  if (state.interval) clearInterval(state.interval)

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

export function usePlayer() {
  const { current, queue, elapsed } = useStore(store)

  return { current: queue[current], queue, elapsed, setQueue, goto, play, pause }
}
