import { Button } from '@heroui/react'
import { usePlayer } from '@/player'
import { Trash2Icon } from 'lucide-react'
import { SelectAllControls } from '@/components'
import { ControlsContainer, List, ListItem, useTrackSelection } from '@/tracks/components'

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

      <List data={player.queue}>
        {(item, index) => (
          <ListItem
            key={item.hash}
            index={index}
            data={item}
            isSelected={selection.isSelected(item)}
            isPlaying={player.current?.hash === item.hash}
            onToggleSelect={selection.toggle}
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
