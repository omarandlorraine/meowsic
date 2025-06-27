import { invoke } from '@tauri-apps/api/core'
import { formatTime } from '@/utils'

export type Track = {
  hash: string
  path: string
  name: string
  extension: string
  duration: number
  cover: string | null
  tags: Record<string, string>
}

export async function getTracks() {
  return await invoke<Track[]>('db_get_tracks')
}

export function normalizeMeta(track?: Track | null) {
  let duration = formatTime(track?.duration)
  if (!track) return { duration }

  let title = track.name
  let artist = ''
  let album = ''
  let albumArtist = ''
  let date = ''
  let genre = ''

  for (const [key, value] of Object.entries(track.tags)) {
    // prettier-ignore
    switch (key) {
      case 'TrackTitle':    title = value;        break
      case 'Artist':        artist = value;       break
      case 'Album':         album = value;        break
      case 'AlbumArtist':   albumArtist = value;  break        
      case 'Date':          date = value;         break
      case 'Genre':         genre = value;        break
    }
  }

  return { title, artist, album, albumArtist, date, genre, duration }
}
