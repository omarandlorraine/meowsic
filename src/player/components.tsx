import { Button, Image, Slider } from '@heroui/react'
import {
  Disc3Icon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  UserRoundIcon,
} from 'lucide-react'
import { getAssetUrl, formatTime } from '@/utils'
import { normalizeMeta, usePlayer } from '@/player'
import { useEffect, useState } from 'react'

export function Player() {
  const player = usePlayer()

  const [progress, setProgress] = useState<number | number[]>(player.elapsed)
  const maxProgress = player.current?.duration ? Math.floor(player.current.duration) : -1

  useEffect(() => setProgress(player.elapsed), [player.elapsed])

  const meta = normalizeMeta(player.current)

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="size-80 rounded-small overflow-hidden mb-18">
        {player.current?.cover ? (
          <Image
            isBlurred
            radius="sm"
            width="100%"
            height="100%"
            src={getAssetUrl(player.current.cover)}
            classNames={{ wrapper: 'size-full', img: 'size-full object-contain' }}
          />
        ) : (
          <div className="size-full grid place-items-center bg-radial from-secondary-50/75 to-default-50/25">
            <MusicIcon className="size-1/3 text-secondary-900 opacity-50" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-4/5 p-3">
        <div className="text-large mr-auto">{meta?.title || 'Unknown Track'}</div>

        {meta?.album && (
          <div className="text-default-500 flex items-center gap-2 text-small">
            <Disc3Icon /> {meta.album}
          </div>
        )}

        {meta?.artist && (
          <div className="text-default-500 flex items-center gap-2 text-small">
            <UserRoundIcon /> {meta.artist}
          </div>
        )}
      </div>

      <div className="flex flex-col w-4/5 mx-auto p-3 gap-3">
        <Slider
          size="sm"
          color="foreground"
          aria-label="Progress"
          value={progress}
          maxValue={maxProgress}
          onChange={setProgress}
          onChangeEnd={value => {
            if (typeof value === 'number') {
              player.seek(value)
              setProgress(value)
            }
          }}
        />

        <div className="flex justify-between">
          <div className="text-small">{formatTime(player.elapsed)}</div>
          <div className="text-small text-foreground/50">{formatTime(player.current?.duration)}</div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-3">
        <Button isIconOnly radius="full" variant="light">
          <RepeatIcon className="text-lg" />
        </Button>

        <Button isIconOnly radius="full" variant="light" size="lg" onPress={player.prev} isDisabled={!player.hasPrev}>
          <SkipBackIcon className="text-xl" />
        </Button>

        <Button isIconOnly radius="full" variant="flat" color="secondary" className="size-20" onPress={player.toggle}>
          {player.isPaused ? <PlayIcon className="text-2xl" /> : <PauseIcon className="text-2xl" />}
        </Button>

        <Button isIconOnly radius="full" variant="light" size="lg" onPress={player.next} isDisabled={!player.hasNext}>
          <SkipForwardIcon className="text-xl" />
        </Button>

        <Button isIconOnly radius="full" variant="light">
          <ShuffleIcon className="text-lg" />
        </Button>
      </div>
    </div>
  )
}
