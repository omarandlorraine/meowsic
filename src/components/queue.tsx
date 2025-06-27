import { usePlayer } from '@/player'
import { TrackListItem } from '@/tracks/components'

export function QueueScreen() {
  const player = usePlayer()

  return (
    <div className="px-3 pb-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] overflow-auto w-full">
      <div className="flex flex-col gap-1 divide-y divide-default/30">
        {player.queue.map((track, index) => (
          <TrackListItem
            key={track.hash}
            data={track}
            isPlaying={player.current?.hash === track.hash}
            onPlay={async () => {
              await player.goto(index)
              await player.play()
            }}
          />
        ))}
      </div>
    </div>
  )
}
