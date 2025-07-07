import { WebPlayer } from '@/player/types'
import type { Track } from '@/tracks'
import type { GetIndexParams, Repeat, Template, Timeout } from '@/player'
import type { Player } from '@/player/types'

export function getNextIndex({ queue, current, repeat }: GetIndexParams) {
  if (isRepeatCurrent(repeat)) return current
  if (queue.length > current + 1) return current + 1
  return repeat ? 0 : -1
}

export function getPrevIndex({ queue, current, repeat }: GetIndexParams) {
  if (isRepeatCurrent(repeat)) return current
  if (current > 0) return current - 1
  return repeat ? queue.length - 1 : -1
}

export function isRepeatCurrent(repeat: Repeat | null) {
  return repeat?.[0] === 'c'
}

export function isEmotionRankingAllowed(template?: Template | null) {
  return !template // || (template[0] !== 'e' && template[0] !== 'a')
}

export function invalidateInterval(interval?: Timeout | null) {
  if (interval) clearInterval(interval)
}

export function selectPlayer(track: Track, players: Player[]) {
  // player must exist since tracks are already filtered
  if (track.path.startsWith('http')) return players.find(it => it instanceof WebPlayer)!
  return players.find(it => it.associated.includes(track.extension))!
}
