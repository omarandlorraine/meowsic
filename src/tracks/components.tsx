import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, cn, Image } from '@heroui/react'
import { AudioLinesIcon, Disc3Icon, MusicIcon, PlayIcon, UserRoundIcon } from 'lucide-react'
import { getAssetUrl } from '@/utils'
import { usePlayer } from '@/player'
import { getTracks, normalizeMeta } from '@/tracks'
import type { Track } from '@/tracks'

export function TracksScreen() {
  const navigate = useNavigate()
  const player = usePlayer()

  const query = useQuery({
    queryKey: ['tracks'],
    queryFn: getTracks,
  })

  return (
    <div className="px-3 pb-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] overflow-auto w-full">
      {query.isSuccess && (
        <div className="flex flex-col gap-1 divide-y divide-default/30">
          {query.data.map(track => {
            return (
              <TrackListItem
                key={track.hash}
                data={track}
                isPlaying={player.current?.hash === track.hash}
                onPlay={async () => {
                  await player.setQueue([track])
                  await player.goto(0)
                  await player.play()
                  navigate('/')
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

type TrackListItemProps = { data: Track; isPlaying?: boolean; onPlay?: () => void }

export function TrackListItem({ data, isPlaying, onPlay }: TrackListItemProps) {
  const meta = normalizeMeta(data)

  return (
    <div className="flex items-center gap-6 p-3">
      {onPlay && (
        <Button isIconOnly radius="full" variant="flat" onPress={onPlay}>
          <PlayIcon className="text-lg" />
        </Button>
      )}

      <Cover url={data.cover} className="size-16" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {isPlaying && <AudioLinesIcon  className="text-lg text-secondary-600" />}

          {meta.title}
        </div>

        {meta.album && meta.artist && (
          <div className="flex items-center gap-2">
            <div className="text-default-500 flex items-center gap-2 text-small">
              <Disc3Icon /> {meta.album}
            </div>

            <div className="text-default-500 flex items-center gap-2 text-small">
              <UserRoundIcon /> {meta.artist}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type CoverProps = { url?: string | null; className?: string }

export function Cover({ url, className }: CoverProps) {
  return (
    <div className={cn('rounded-small overflow-hidden', className)}>
      {url ? (
        <Image
          isBlurred
          radius="sm"
          width="100%"
          height="100%"
          loading="lazy"
          src={getAssetUrl(url)}
          classNames={{ wrapper: 'size-full', img: 'size-full object-contain' }}
        />
      ) : (
        <CoverPlaceholder />
      )}
    </div>
  )
}

export function CoverPlaceholder() {
  return (
    <div className="size-full grid place-items-center bg-radial from-secondary-50/75 to-default-50/25">
      <MusicIcon className="size-1/3 text-secondary-900 opacity-50" />
    </div>
  )
}
