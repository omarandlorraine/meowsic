// tauri `convertFileSrc` won't work
export function getAssetUrl(path: string) {
  return `http://asset.localhost/${path}`
}

export function formatTime(value?: number | null): string {
  if (value == null || isNaN(value) || value <= 0) return '0:00'

  const rounded = value // Math.floor(value) // already whole seconds
  const mins = Math.floor(rounded / 60)
  const secs = rounded % 60

  // format with 1+ digits for mins, 2 digits for secs
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
