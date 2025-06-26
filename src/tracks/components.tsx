import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { usePlayer } from '@/player'
import type { Track } from '@/tracks'

export function TracksScreen() {
  const query = useQuery({
    queryKey: ['tracks'],
    queryFn: () => invoke<Track[]>('get_tracks'),
  })

  const player = usePlayer()

  return (
    <div className="pr-3 pb-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] overflow-auto w-full">
      {query.isSuccess && (
        <div className="grid grid-cols-2 gap-3">
          {query.data.map(track => (
            <button
              key={track.hash}
              onClick={async () => {
                await player.setQueue([track])
                await player.goto(0)
              }}>
              {track.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
