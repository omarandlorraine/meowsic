import { invoke } from '@tauri-apps/api/core'

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
