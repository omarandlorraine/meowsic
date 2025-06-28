import { invoke } from '@tauri-apps/api/core'
import { formatTime } from '@/utils'

export type Track = {
  hash: string
  path: string
  name: string
  extension: string
  duration: number
  cover?: string | null
  title?: string | null
  artist?: string | null
  album?: string | null
  albumArtist?: string | null
  date?: string | null
  genre?: string | null
}

export async function getTracks() {
  return await invoke<Track[]>('db_get_tracks')
}

export function normalizeMeta(track?: Track | null) {
  return {
    duration: formatTime(track?.duration),
    title: track?.title ?? track?.name,
    artist: track?.artist,
    album: track?.album,
    albumArtist: track?.albumArtist,
    date: track?.date,
    genre: track?.genre,
  }
}
