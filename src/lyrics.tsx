import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { fetch } from '@tauri-apps/plugin-http'
import {
  Button,
  cn,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Switch,
  Textarea,
} from '@heroui/react'
import { CheckIcon } from 'lucide-react'
import type { Disclosure } from '@/utils'
import type { Track } from '@/tracks'

export type ExternalLyrics = {
  id: number
  name: string
  trackName: string
  artistName: string
  albumName: string
  duration: number
  instrumental: boolean
  plainLyrics: string
  syncedLyrics?: string
}

export type Lyrics = { plain: string; synced: string }

export async function searchExternalLyrics(track: Track) {
  const res = await fetch(
    `https://lrclib.net/api/search?artist_name=${track.artist}&track_name=${track.title}&album_name=${track.album}&duration=${track.duration}`,
  )
  const data = (await res.json()) as ExternalLyrics[]

  return data.map<Lyrics>(it => ({ plain: it.plainLyrics, synced: it.syncedLyrics ?? '' }))
}

export async function getLyrics(track: Track) {
  return await invoke<Lyrics | null>('db_get_lyrics', { hash: track.hash })
}

export async function setLyrics(track: Track, lyrics: Lyrics) {
  return await invoke('db_set_lyrics', { hash: track.hash, lyrics })
}

type SyncedLyricsViewProps = {
  data: string
  elapsed: number
  duration?: number
  className?: string
  onSeek?: (elapsed: number) => void
}

export function SyncedLyricsView({
  data,
  elapsed,
  onSeek,
  duration = Number.MAX_SAFE_INTEGER,
  className,
}: SyncedLyricsViewProps) {
  const lines = data.split('\n').map(parseLine)

  const isCurrent = (index: number) =>
    (lines[index]?.time ?? 0) <= elapsed && elapsed < (lines[index + 1]?.time ?? duration)

  const findCurrentIndex = () => {
    for (let i = 0; i < lines.length; i++) if (isCurrent(i)) return i
    return 0
  }

  const [currentIndex, setCurrentIndex] = useState(findCurrentIndex)

  useEffect(() => {
    if (isCurrent(currentIndex)) return
    setCurrentIndex(findCurrentIndex())
  }, [elapsed])

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    ref.current
      .querySelector<HTMLElement>(`#lyrics-${lines[currentIndex]?.time}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIndex])

  return (
    <ScrollShadow ref={ref} hideScrollBar className={className}>
      <div className="flex flex-col gap-2 text-center items-center p-3">
        {lines.map((line, index) => {
          if (!line) return null
          let key = `lyrics-${line.time}`

          return (
            <button
              key={key}
              id={key}
              type="button"
              onClick={() => onSeek?.(line.time)}
              className={cn(
                'text-default-300',
                index === currentIndex && 'text-warning-600',
                onSeek && 'cursor-pointer',
              )}>
              {line.text || '. . .'}
            </button>
          )
        })}
      </div>
    </ScrollShadow>
  )
}

type PlainLyricsViewProps = { data: string; className?: string }

export function PlainLyricsView({ data, className }: PlainLyricsViewProps) {
  const lines = data.split('\n')

  return (
    <ScrollShadow hideScrollBar className={className}>
      <div className="flex flex-col gap-2 text-center text-default-600">
        {lines.map((line, index) => {
          return <div key={line + index}>{line || '. . .'}</div>
        })}
      </div>
    </ScrollShadow>
  )
}

const SYNCED_LYRICS_REGEX = /^\[(\d{2}):(\d{2})\.(\d{1,2})\]\s*(.*)$/

function parseLine(line: string) {
  const match = line.match(SYNCED_LYRICS_REGEX)
  if (!match) return null

  const [, minutes, seconds, fraction, text] = match
  const totalSeconds = parseInt(minutes, 10) * 60 + parseInt(seconds, 10) + parseInt(fraction.padEnd(2, '0'), 10) / 100

  return { time: Math.round(totalSeconds), text }
}

type LyricsEditorModalProps = { disclosure: Disclosure; onSave: (value: string, isSynced: boolean) => void }

// TODO: can probably add more editor functions
export function LyricsEditorModal({ disclosure, onSave }: LyricsEditorModalProps) {
  const [lyrics, setLyrics] = useState('')
  const [isSynced, setIsSynced] = useState(true)

  return (
    <Modal
      radius="sm"
      backdrop="blur"
      placement="bottom-center"
      isOpen={disclosure.isOpen}
      onClose={() => setLyrics('')}
      onOpenChange={disclosure.onOpenChange}>
      <ModalContent>
        <ModalHeader>Lyrics</ModalHeader>

        <ModalBody>
          <Textarea
            autoFocus
            isClearable
            variant="flat"
            minRows={20}
            maxRows={60}
            value={lyrics}
            onValueChange={setLyrics}
            onClear={() => setLyrics('')}
            placeholder="Paste your lyrics here..."
          />
        </ModalBody>

        <ModalFooter className="justify-between">
          <Switch size="sm" color="secondary" isSelected={isSynced} onValueChange={setIsSynced}>
            Synced
          </Switch>

          <Button
            radius="sm"
            variant="flat"
            color="success"
            isDisabled={!lyrics.trim()}
            onPress={() => {
              onSave(lyrics, isSynced)
              setLyrics('')
              disclosure.onClose()
            }}>
            <CheckIcon className="text-lg" /> Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
