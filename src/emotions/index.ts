import { invoke } from '@tauri-apps/api/core'
import { DEFAULT_EMOTION, store } from '@/settings'
import type { Track } from '@/tracks'

export type Emotion = { name: string; color: string; icon: string }

export async function getEmotions() {
  return await invoke<Emotion[]>('db_get_emotions')
}

export async function getEmotionTracks(name: string) {
  return await invoke<Track[]>('db_get_emotion_tracks', { name })
}

export async function rankUp(track: Track) {
  try {
    const emotion = store.getState().currentEmotion
    if (emotion === DEFAULT_EMOTION) return

    await invoke('db_rank_up_emotion_track', { name: emotion, hash: track.hash })
    console.log(`Ranked up ${track.name} in ${emotion}`)
  } catch (err) {
    console.error(err)
  }
}
