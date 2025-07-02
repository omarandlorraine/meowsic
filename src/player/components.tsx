import { useLayoutEffect, useState } from 'react'
import { useStore } from 'zustand'
import { Button, Image, Slider } from '@heroui/react'
import {
  Disc3Icon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  UserRoundIcon,
} from 'lucide-react'
import { formatTime, getAssetUrl, store } from '@/utils'
import { usePlayer } from '@/player'
import { normalizeMeta } from '@/tracks'
import { Cover } from '@/tracks/components'

export function Player() {
  const player = usePlayer()
  const meta = normalizeMeta(player.current)
  const isPlayerMaximized = useStore(store, state => state.isPlayerMaximized)
  const [progress, setProgress] = useState<number | number[]>(player.elapsed)

  useLayoutEffect(() => setProgress(player.elapsed), [player.elapsed])

  return (
    <div className="flex flex-col items-center justify-center h-full isolate">
      {isPlayerMaximized && player.current?.cover && (
        <div className="fixed -inset-10 -z-10 brightness-25 saturate-50 blur-2xl">
          <Image removeWrapper src={getAssetUrl(player.current.cover)} className="size-full object-cover" />
        </div>
      )}

      <Cover url={player.current?.cover} className="size-80 mb-18" />

      <div className="flex items-center gap-2 w-4/5 p-3">
        {meta.title && <div className="text-large mr-auto">{meta.title}</div>}

        {meta.album && (
          <div className="text-default-500 flex items-center gap-2 text-small">
            <Disc3Icon /> {meta.album}
          </div>
        )}

        {meta.artist && (
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
          maxValue={player.current?.duration ?? -1}
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
          <div className="text-small text-default-500">{meta.duration}</div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-3">
        <Button isIconOnly isDisabled radius="full" variant="light">
          <RepeatIcon className="text-lg" />
        </Button>

        <Button isIconOnly radius="full" variant="light" size="lg" onPress={player.prev} isDisabled={!player.hasPrev}>
          <SkipBackIcon className="text-xl" />
        </Button>

        <Button
          isIconOnly
          radius="full"
          variant="flat"
          color="secondary"
          className="size-20"
          onPress={player.toggle}
          isDisabled={!player.current}>
          {player.isPaused ? <PlayIcon className="text-2xl" /> : <PauseIcon className="text-2xl" />}
        </Button>

        <Button isIconOnly radius="full" variant="light" size="lg" onPress={player.next} isDisabled={!player.hasNext}>
          <SkipForwardIcon className="text-xl" />
        </Button>

        <Button isIconOnly isDisabled radius="full" variant="light">
          <ShuffleIcon className="text-lg" />
        </Button>
      </div>
    </div>
  )
}
