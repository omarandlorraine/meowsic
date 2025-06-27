import { useQuery } from '@tanstack/react-query'
import { usePlayer } from '@/player'
import { getTracks } from '@/tracks'

export function TracksScreen() {
  const query = useQuery({
    queryKey: ['tracks'],
    queryFn: getTracks,
  })

  const player = usePlayer()

  return (
    <div className="pr-3 pb-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] overflow-auto w-full">
      {query.isSuccess && (
        <div className="grid grid-cols-2 gap-3">
          {query.data.map((track, index) => (
            <button
              key={track.hash}
              onClick={async () => {
                await player.setQueue([track, query.data[index + 1]]) // TODO: temp
                await player.goto(0)
                await player.play()
              }}>
              {track.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
