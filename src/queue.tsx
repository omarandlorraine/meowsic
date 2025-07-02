import { Button } from '@heroui/react'
import { Trash2Icon } from 'lucide-react'
import { reorder } from '@/utils'
import { usePlayer } from '@/player'
import { SelectAllControls } from '@/components'
import { ControlsContainer, List, ListItem, useTrackSelection } from '@/tracks/components'
import type { DropResult } from '@hello-pangea/dnd'

export function QueueScreen() {
  const player = usePlayer()
  const selection = useTrackSelection()

  const onRemove = async () => {
    if (!player.current) return

    const reset = async () => {
      await player.setQueue([])
      await player.setCurrent(0)
      await player.stop()
    }

    if (!selection.values.length) return reset()

    const filtered = player.queue.filter(track => !selection.isSelected(track))
    const newIndex = filtered.findIndex(track => track === player.current) // compare by reference

    if (!filtered.length) reset()
    else {
      await player.setQueue(filtered)

      if (newIndex !== -1) await player.setCurrent(newIndex)
      else {
        // current track was removed
        await player.goto(0)
        await player.pause()
      }
    }

    selection.clear()
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const src = result.source.index
    const dst = result.destination.index
    if (src === dst) return

    await player.setQueue(reorder(player.queue, src, dst))

    if (src === player.currentIndex) await player.setCurrent(dst)
    else if (src < dst) await player.setCurrent(player.currentIndex - 1)
    else if (src > dst) await player.setCurrent(player.currentIndex + 1)
  }

  return (
    <div className="flex flex-col size-full relative">
      <ControlsContainer>
        {selection.values.length > 0 && <SelectAllControls data={player.queue} selection={selection} />}

        <Button
          radius="sm"
          variant="flat"
          color="danger"
          className="!text-foreground"
          onPress={onRemove}
          isDisabled={!player.queue.length}>
          <Trash2Icon className="text-lg" /> Remove {selection.values.length > 0 ? 'Selected' : 'All'}
        </Button>
      </ControlsContainer>

      <List data={player.queue} onDragEnd={onDragEnd}>
        {(item, index, draggableProps) => (
          <ListItem
            key={item.hash}
            index={index}
            data={item}
            isSelected={selection.isSelected(item)}
            isPlaying={player.current?.hash === item.hash}
            onToggleSelect={selection.toggle}
            draggableProps={draggableProps}
            onPlay={async () => {
              await player.goto(index)
              await player.play()
            }}
          />
        )}
      </List>
    </div>
  )
}
