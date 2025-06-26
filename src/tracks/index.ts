export type Track = {
  hash: string
  path: string
  name: string
  extension: string
  duration: number
  cover: string | null
  tags: Record<string, string>
}
