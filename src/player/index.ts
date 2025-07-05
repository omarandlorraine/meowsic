import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { createStore, useStore } from 'zustand'
import { rankUp } from '@/emotions'
import type { ShortcutHandler } from '@tauri-apps/plugin-global-shortcut'
import type { Track } from '@/tracks'

type Timeout = ReturnType<typeof setInterval>
type Template = 'emotions' | 'arbitrary'
type Repeat = 'current' | 'all'

type Store = {
  queue: Track[]
  current: number
  elapsed: number
  volume: number
  isPaused: boolean
  repeat: Repeat | null
  template: Template | null
  interval: Timeout | null
  backupQueue: Track[]
  isShuffled: boolean
}

export const store = createStore<Store>(() => ({
  queue: [],
  current: 0,
  elapsed: 0,
  volume: 1,
  isPaused: true,
  repeat: null,
  template: null,
  interval: null,
  backupQueue: [],
  isShuffled: false,
}))

async function setQueue(queue: Track[], reflect = true) {
  await invoke('player_set_queue', { queue: queue.map(t => t.path) })

  if (reflect) store.setState({ queue, backupQueue: [], isShuffled: false })
}

async function setCurrent(current: number, reflect = true) {
  await invoke('player_set_current', { index: current })

  if (reflect) store.setState({ current })
}

export async function goto(index: number) {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  await invoke('player_goto', { index })
  const interval = state.isPaused ? null : createInterval()

  store.setState({ current: index, elapsed: 0, interval })
}

export async function next() {
  const state = store.getState()
  const index = nextIndex(state)

  if (index === -1) return
  await goto(index)
}

export async function prev() {
  const state = store.getState()
  const index = prevIndex(state)

  if (index === -1) return
  await goto(index)
}

export async function seek(elapsed: number) {
  const state = store.getState()
  if (!state.isPaused) invalidateInterval(state.interval)

  await invoke('player_seek', { elapsed })
  const interval = state.isPaused ? null : createInterval()

  store.setState({ elapsed, interval })
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

export async function getArbitraryTracks() {
  return await invoke<Track[]>('player_get_arbitrary_tracks')
}

export function setTemplate(template: Template | null) {
  store.setState({ template })
}

export function setRepeat(repeat: Repeat | null) {
  store.setState({ repeat })
}

export async function playTracks(data: Track | Track[]) {
  await setQueue(Array.isArray(data) ? data : [data])
  await goto(0)
  await play()
}

export async function shuffle() {
  const state = store.getState()
  const current = state.queue.at(state.current)
  if (!current) return

  const shuffled = state.queue.toSorted(() => Math.random() - 0.5)
  const index = shuffled.findIndex(it => it.hash === current.hash)
  const backupQueue = state.queue

  await setCurrent(index, false)
  await setQueue(shuffled, false)

  store.setState({ isShuffled: true, backupQueue, current: index, queue: shuffled })
}

export async function unshuffle() {
  const state = store.getState()
  const current = state.queue.at(state.current)
  if (!current || !state.isShuffled) return

  const original = state.backupQueue
  const index = original.findIndex(it => it.hash === current.hash)

  await setCurrent(index, false)
  await setQueue(original, false)

  store.setState({ isShuffled: false, backupQueue: [], current: index, queue: original })
}

export async function reset() {
  await setQueue([])
  await setCurrent(0)
  await stop()
}

function createInterval() {
  return setInterval(() => {
    const state = store.getState()
    const current = state.queue.at(state.current)

    if (!current) return stop()
    if (state.elapsed > current.duration) return next()

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

export async function init() {
  listen<Track>('play-arbitrary-track', async evt => {
    await playTracks(evt.payload)
    setTemplate('arbitrary')
  })

  const tracks = await getArbitraryTracks()
  if (!tracks.length) return

  await playTracks(tracks)
  setTemplate('arbitrary')
}

type FindIndexParams = Pick<Store, 'queue' | 'current' | 'repeat'>

function nextIndex({ queue, current, repeat }: FindIndexParams) {
  if (isRepeatCurrent(repeat)) return current
  if (queue.length > current + 1) return current + 1
  return repeat ? 0 : -1
}

function prevIndex({ queue, current, repeat }: FindIndexParams) {
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

export function usePlayer() {
  const state = useStore(store)

  return {
    toggleShuffle: state.isShuffled ? unshuffle : shuffle,
    isRepeatCurrent: isRepeatCurrent(state.repeat),
    current: state.queue.at(state.current),
    toggle: state.isPaused ? play : pause,
    hasPrev: prevIndex(state) !== -1,
    hasNext: nextIndex(state) !== -1,
    isShuffled: state.isShuffled,
    currentIndex: state.current,
    isPaused: state.isPaused,
    elapsed: state.elapsed,
    repeat: state.repeat,
    queue: state.queue,
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
