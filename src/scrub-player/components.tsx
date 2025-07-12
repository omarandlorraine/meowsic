import { useState } from 'react'
import { Button, Input, Tooltip } from '@heroui/react'
import { ChevronsLeftIcon, ChevronsRightIcon, PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import { formatTime } from '@/utils'
import { SeekBar } from '@/players'
import { useScrubPlayer } from '@/scrub-player'
import { normalizeMeta } from '@/tracks'
import { AlbumLink, ArtistLink, Cover } from '@/tracks/components/details'
import type { Track } from '@/tracks'

export function ScrubPlayer() {
  const player = useScrubPlayer()
  const meta = normalizeMeta(player.current)

  const [seekBy, setSeekBy] = useState(10)

  return (
    <div className="flex flex-col items-center justify-center h-full isolate pb-6 pt-3">
      <div className="flex w-full px-8 gap-3">
        <Cover url={player.current?.cover} className="size-40 shrink-0" />

        <div className="flex flex-col gap-2">
          {meta.title && <div className="text-large">{meta.title}</div>}

          {meta.album && <AlbumLink>{meta.album}</AlbumLink>}
          {meta.artist && <ArtistLink>{meta.artist}</ArtistLink>}
        </div>
      </div>

      <div className="flex flex-col mx-auto gap-3 w-full p-8">
        <SeekBar
          onSeek={player.seek}
          elapsed={player.elapsed}
          duration={player.current?.duration}
          isDisabled={!player.current || !!player.error}
        />

        <div className="flex justify-between">
          <div className="text-small">{formatTime(player.elapsed)}</div>
          <div className="text-small text-default-500">{meta.duration}</div>
        </div>
      </div>

      <div className="flex w-full items-center px-8 gap-3">
        <PlayButton
          toggle={player.togglePlay}
          current={player.current}
          isPaused={player.isPaused}
          error={player.error}
        />

        <Button isIconOnly radius="full" variant="flat" size="lg" color="warning" onPress={() => player.seek(0)}>
          <RotateCcwIcon className="text-xl" />
        </Button>

        <div className="flex items-center gap-0.5 ml-auto">
          <Button
            isIconOnly
            radius="none"
            variant="flat"
            className="rounded-l-small"
            isDisabled={!seekBy}
            onPress={() => player.seek(Math.max(0, player.elapsed - seekBy))}>
            <ChevronsLeftIcon className="text-lg" />
          </Button>

          <Input
            radius="none"
            variant="flat"
            value={seekBy.toString()}
            onValueChange={value => {
              const n = +value
              setSeekBy(!isNaN(n) ? n : 0)
            }}
            classNames={{
              input: 'bg-transparent placeholder:text-default-300 text-center',
              innerWrapper: 'bg-transparent',
              inputWrapper: 'dark:bg-default/40',
              base: 'w-20',
            }}
          />

          <Button
            isIconOnly
            radius="none"
            variant="flat"
            className="rounded-r-small"
            isDisabled={!seekBy}
            onPress={() => player.seek(Math.min(player.current?.duration ?? 0, player.elapsed + seekBy))}>
            <ChevronsRightIcon className="text-lg" />
          </Button>
        </div>
      </div>
    </div>
  )
}

type PlayButtonProps = { isPaused: boolean; error?: Error | null; current?: Track | null; toggle: () => void }

function PlayButton({ current, error, isPaused, toggle }: PlayButtonProps) {
  return (
    <div className="relative">
      {error && (
        <Tooltip size="sm" radius="sm" className="bg-danger-100" content={error.message}>
          <div className="absolute inset-0 rounded-full" />
        </Tooltip>
      )}

      <Button
        isIconOnly
        radius="full"
        variant="flat"
        className="size-20"
        color={error ? 'danger' : 'secondary'}
        isDisabled={!current || !!error}
        onPress={toggle}>
        {isPaused ? <PlayIcon className="text-2xl" /> : <PauseIcon className="text-2xl" />}
      </Button>
    </div>
  )
}
