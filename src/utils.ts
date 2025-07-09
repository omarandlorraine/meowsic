import { useState } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'

export function getAssetUrl(path: string) {
  // return `http://asset.localhost/${path}`
  return convertFileSrc(path)
}

export function formatTime(value?: number | null): string {
  if (value == null || isNaN(value) || value <= 0) return '0:00'

  const rounded = value // Math.floor(value) // already whole seconds
  const mins = Math.floor(rounded / 60)
  const secs = rounded % 60

  // format with 1+ digits for mins, 2 digits for secs
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export type UseSelection<T> = {
  values: T[]
  set: React.Dispatch<React.SetStateAction<T[]>>
  isSelected: (data: T) => boolean
  toggle: (data: T, previouslySelected?: boolean) => void
  clear: () => void
}

export function useSelection<T>(isEqual: (a: T, b: T) => boolean): UseSelection<T> {
  const [values, set] = useState<T[]>([])

  const isSelected = (data: T) => values.some(t => isEqual(t, data))
  const clear = () => set([])

  const toggle = (data: T, previouslySelected?: boolean) => {
    if (previouslySelected) set(state => state.filter(t => !isEqual(t, data)))
    else set(state => state.concat(data))
  }

  return { values, set, isSelected, toggle, clear }
}

export function reorder<T>(items: T[], src: number, dst: number) {
  const res = Array.from(items)
  const [removed] = res.splice(src, 1)

  res.splice(dst, 0, removed)
  return res
}

export type EditorType = 'new' | 'update' | 'remove'

export function isEditorOfType(type: EditorType, expected: EditorType) {
  return type[0] === expected[0]
}
