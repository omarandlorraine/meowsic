import { invoke } from '@tauri-apps/api/core'
import { createStore } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@/tracks'

export const DEFAULT_EMOTION = 'Neutral'

export type Emotion = { name: string; color: string; icon: string }

export async function getEmotions() {
  return await invoke<Emotion[]>('db_get_emotions')
}

export async function getEmotionTracks(name: string) {
  return await invoke<Track[]>('db_get_emotion_tracks', { name })
}

type Store = { current: string }

export const store = createStore<Store>()(persist(() => ({ current: DEFAULT_EMOTION }), { name: 'emotions' }))

export async function setEmotion(name: string) {
  store.setState({ current: name })
}

export async function rankUp(track: Track) {
  try {
    const emotion = store.getState().current
    if (emotion === DEFAULT_EMOTION) return

    await invoke('db_rank_up_emotion_track', { name: emotion, hash: track.hash })
    console.log(`Ranked up ${track.name} in ${emotion}`)
  } catch (err) {
    console.error(err)
  }
}
