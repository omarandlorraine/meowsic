// tauri `convertFileSrc` won't work
export function getAssetUrl(path: string) {
  return `http://asset.localhost/${path}`
}
