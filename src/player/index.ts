import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { createStore, useStore } from 'zustand'
import { rankUp } from '@/emotions'
import { setMiniPlayerVisibility, setPlayerMaximized } from '@/settings'
import type { ShortcutHandler } from '@tauri-apps/plugin-global-shortcut'
import type { Track } from '@/tracks'
import { addToast } from '@heroui/react'

type Timeout = ReturnType<typeof setInterval>
type Template = 'emotions' | 'arbitrary'
type Repeat = 'current' | 'all'

type Store = {
  queue: Track[]
  current: number
  elapsed: number
  isPaused: boolean
  // interval is null if the player is paused
  interval: Timeout | null
  repeat: Repeat | null
  template: Template | null
  isShuffled: boolean
  // backup queue for reverting shuffle
  backupQueue: Track[]
  error?: Error | null
}

function initialState(): Store {
  return {
    queue: [],
    current: 0,
    elapsed: 0,
    isPaused: true,
    interval: null,
    repeat: null,
    template: null,
    isShuffled: false,
    backupQueue: [],
  }
}

export const store = createStore<Store>(initialState)

// NOTE: if not paused, invalidate the interval and create a new one

export async function goto(index: number) {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  try {
    await invoke('player_goto', { index })
    const interval = !state.isPaused ? createInterval() : null

    store.setState({ current: index, elapsed: 0, interval, error: null })
  } catch (err) {
    console.error(err)

    const error = err as Error // since backend response have similar type
    store.setState({ current: index, elapsed: 0, error })

    addToast({ timeout: 5000, title: 'Track', description: error.message, color: 'danger' })
  }
}

export async function seek(elapsed: number) {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  await invoke('player_seek', { elapsed })
  const interval = !state.isPaused ? createInterval() : null

  store.setState({ elapsed, interval })
}

export async function pause() {
  const state = store.getState()
  if (state.isPaused || state.error) return

  invalidateInterval(state.interval)
  await invoke('player_pause')

  store.setState({ interval: null, isPaused: true })
}

export async function play() {
  const state = store.getState()
  if (!state.isPaused || state.error) return

  await invoke('player_play')
  const interval = createInterval()

  store.setState({ interval, isPaused: false })
}

export async function playTracks(data: Track | Track[], from = 0) {
  const queue = Array.isArray(data) ? data : [data]

  await setQueue(queue)
  store.setState({ queue, isShuffled: false, backupQueue: [] })

  await goto(from)
  await play()
}

export async function shuffle() {
  const state = store.getState()
  const current = state.queue.at(state.current)
  if (state.isShuffled) return

  const shuffled = state.queue.toSorted(() => Math.random() - 0.5)
  const index = shuffled.findIndex(it => it === current)
  const backupQueue = state.queue

  await setCurrent(index)
  await setQueue(shuffled)

  store.setState({ isShuffled: true, backupQueue, current: index, queue: shuffled })
}

export async function unshuffle() {
  const state = store.getState()
  const current = state.queue.at(state.current)
  if (!state.isShuffled) return

  const original = state.backupQueue
  const index = original.findIndex(it => it === current)

  await setCurrent(index)
  await setQueue(original)

  store.setState({ isShuffled: false, backupQueue: [], current: index, queue: original })
}

export async function reset() {
  await setQueue([])
  await setCurrent(0)
  await stop()

  const state = store.getState()
  invalidateInterval(state.interval)

  store.setState(initialState())
}

function createInterval() {
  return setInterval(() => {
    const state = store.getState()
    const current = state.queue.at(state.current)

    if (!current) return reset() // TODO: observe for issues ? only stop() was needed here
    if (state.elapsed >= current.duration) return next()

    store.setState(state => ({ elapsed: state.elapsed + 1 }))

    // n seconds before the end, not awaiting the promise
    if (isEmotionRankingAllowed(state.template) && current.duration - state.elapsed === 10) {
      rankUp(current)
    }
  }, 1000)
}

function invalidateInterval(interval?: Timeout | null) {
  if (interval) clearInterval(interval)
}

async function playArbitraryTracks(data: Track | Track[]) {
  await playTracks(Array.isArray(data) ? data : [data])
  setTemplate('arbitrary')

  setPlayerMaximized(true)
  setMiniPlayerVisibility(true)
}

export async function init() {
  listen<Track>('play-arbitrary-track', async evt => {
    await playArbitraryTracks(evt.payload)
  })

  const tracks = await getArbitraryTracks()
  if (!tracks.length) return

  await playArbitraryTracks(tracks)
}

export async function next() {
  const state = store.getState()
  const index = getNextIndex(state)

  if (index === -1) return await reset()
  await goto(index)
}

export async function prev() {
  const state = store.getState()
  const index = getPrevIndex(state)

  if (index === -1) return await reset()
  await goto(index)
}

type GetIndexParams = Pick<Store, 'queue' | 'current' | 'repeat'>

function getNextIndex({ queue, current, repeat }: GetIndexParams) {
  if (isRepeatCurrent(repeat)) return current
  if (queue.length > current + 1) return current + 1
  return repeat ? 0 : -1
}

function getPrevIndex({ queue, current, repeat }: GetIndexParams) {
  if (isRepeatCurrent(repeat)) return current
  if (current > 0) return current - 1
  return repeat ? queue.length - 1 : -1
}

function isRepeatCurrent(repeat: Repeat | null) {
  return repeat?.[0] === 'c'
}

function isEmotionRankingAllowed(template?: Template | null) {
  return !template // || (template[0] !== 'e' && template[0] !== 'a')
}

export function setTemplate(template: Template | null) {
  store.setState({ template })
}

export function setRepeat(repeat: Repeat | null) {
  store.setState({ repeat })
}

export async function extendQueue(tracks: Track[]) {
  const state = store.getState()
  const queue = state.queue.concat(tracks)

  await setQueue(queue)
  store.setState({ queue })
}

async function setQueue(queue: Track[]) {
  await invoke('player_set_queue', { queue: queue.map(t => t.path) })
}

async function setCurrent(current: number) {
  await invoke('player_set_current', { index: current })
}

async function stop() {
  await invoke('player_stop')
}

export async function setVolume(volume: number) {
  await invoke('player_set_volume', { volume })
}

export async function getArbitraryTracks() {
  return await invoke<Track[]>('player_get_arbitrary_tracks')
}

export function usePlayer() {
  const state = useStore(store)

  return {
    setState: store.setState,
    toggleShuffle: state.isShuffled ? unshuffle : shuffle,
    togglePlay: state.isPaused ? play : pause,
    current: state.queue.at(state.current),
    isRepeatCurrent: isRepeatCurrent(state.repeat),
    hasPrev: getPrevIndex(state) !== -1,
    hasNext: getNextIndex(state) !== -1,
    isShuffled: state.isShuffled,
    isPaused: state.isPaused,
    elapsed: state.elapsed,
    repeat: state.repeat,
    queue: state.queue,
    error: state.error,
    setTemplate,
    setCurrent,
    playTracks,
    setVolume,
    setRepeat,
    setQueue,
    reset,
    pause,
    seek,
    goto,
    next,
    prev,
    stop,
    play,
  }
}

export const onGlobalShortcut: ShortcutHandler = evt => {
  if (evt.state === 'Released') return
  const state = store.getState()

  switch (evt.shortcut) {
    case 'MediaPlayPause':
      return state.isPaused ? play() : pause()

    case 'MediaTrackNext':
      return next()

    case 'MediaTrackPrevious':
      return prev()

    case 'MediaStop':
      return reset()
  }
}
