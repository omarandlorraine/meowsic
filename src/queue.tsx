import { useLayoutEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@heroui/react'
import { useStore } from 'zustand'
import { usePlayer } from '@/player'
import { uiStore } from '@/utils'
import {
  SelectAllControls,
  TrackList,
  TrackListContainer,
  TrackListControlsContainer,
  TrackListItem,
  useTrackSelection,
} from '@/tracks/components'
import { Trash2Icon } from 'lucide-react'

export function QueueScreen() {
  const player = usePlayer()
  const fontSize = useStore(uiStore, state => state.fontSize)

  const containerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: player.queue.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => fontSize * 5.5 + 1, // height of cover + padding-y + 1px border
    overscan: 5,
  })

  useLayoutEffect(() => {
    virtualizer.measure()
  }, [fontSize])

  const selection = useTrackSelection()

  const onRemove = async () => {
    if (!player.current) return

    if (!selection.values.length) {
      await player.setQueue([])
      await player.setCurrent(0)
      await player.stop()

      return
    }

    const filtered = player.queue.filter(track => !selection.isSelected(track))
    const newIndex = filtered.findIndex(track => track === player.current) // compare by reference

    await player.setQueue(filtered)

    if (newIndex !== -1) await player.setCurrent(newIndex)
    else {
      // current track was removed
      await player.goto(0)
      await player.pause()
    }

    virtualizer.measure()
    selection.clear()
  }

  return (
    <TrackListContainer ref={containerRef}>
      <TrackListControlsContainer>
        {selection.values.length > 0 && <SelectAllControls data={player.queue} selection={selection} />}

        <Button radius="sm" variant="flat" color="secondary" onPress={onRemove}>
          <Trash2Icon className="text-lg" /> Remove {selection.values.length > 0 ? 'Selected' : 'All'}
        </Button>
      </TrackListControlsContainer>

      <TrackList height={virtualizer.getTotalSize()}>
        {virtualizer.getVirtualItems().map(item => {
          const track = player.queue[item.index]

          return (
            <TrackListItem
              key={track.hash}
              data={track}
              virtualItem={item}
              isSelected={selection.isSelected(track)}
              isPlaying={player.current?.hash === track.hash}
              onToggleSelect={selection.toggle}
              onPlay={async () => {
                await player.goto(item.index)
                await player.play()
              }}
            />
          )
        })}
      </TrackList>
    </TrackListContainer>
  )
}
