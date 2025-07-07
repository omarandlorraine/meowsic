import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useStore } from 'zustand'
import { Button, cn, Image, Slider, Tooltip } from '@heroui/react'
import {
  Disc3Icon,
  PauseIcon,
  PictureInPicture2Icon,
  PlayIcon,
  Repeat1Icon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareArrowOutUpLeftIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { formatTime, getAssetUrl } from '@/utils'
import { store, setMiniPlayerVisibility, setPlayerMaximized } from '@/settings'
import { usePlayer } from '@/player'
import { normalizeMeta } from '@/tracks'
import { Cover } from '@/tracks/components'

type PlayerProps = { mini?: boolean }

export function Player({ mini }: PlayerProps) {
  const player = usePlayer()
  const meta = normalizeMeta(player.current)
  const isPlayerMaximized = useStore(store, state => state.isPlayerMaximized)

  const [progress, setProgress] = useState(player.elapsed)
  const [isSeeking, setIsSeeking] = useState(false)
  const prevElapsed = useRef(player.elapsed)

  useLayoutEffect(() => {
    if (!isSeeking && player.elapsed !== prevElapsed.current) {
      setProgress(player.elapsed)
    }

    prevElapsed.current = player.elapsed
  }, [player.elapsed, isSeeking])

  return (
    <div className={cn('flex flex-col items-center justify-center h-full isolate', mini && 'pb-6 pt-3')}>
      {isPlayerMaximized && player.current?.cover && (
        <div className="fixed -inset-10 -z-10 brightness-25 saturate-50 blur-2xl">
          <Image removeWrapper src={getAssetUrl(player.current.cover)} className="size-full object-cover" />
        </div>
      )}

      {mini ? (
        <div className="flex w-full px-8 gap-3">
          <Cover url={player.current?.cover} className="size-40 shrink-0" />

          <div className="flex flex-col gap-2">
            {meta.title && <div className="text-large">{meta.title}</div>}

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
        </div>
      ) : (
        <>
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
        </>
      )}

      <div className={cn('flex flex-col mx-auto gap-3', mini ? 'w-full p-8' : 'w-4/5 p-3')}>
        <Slider
          size="sm"
          color="foreground"
          aria-label="Progress"
          value={progress}
          maxValue={player.current?.duration ?? -1}
          onChange={value => {
            setIsSeeking(true)
            setProgress(typeof value === 'number' ? value : value[0])
          }}
          isDisabled={!player.current || !!player.error}
          onChangeEnd={value => {
            setIsSeeking(false)
            const pos = typeof value === 'number' ? value : value[0]

            player.seek(pos)
            setProgress(pos)
          }}
        />

        <div className="flex justify-between">
          <div className="text-small">{formatTime(player.elapsed)}</div>
          <div className="text-small text-default-500">{meta.duration}</div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-3">
        <Button
          isIconOnly
          radius="full"
          isDisabled={!player.current}
          variant={player.repeat ? 'flat' : 'light'}
          color={player.isRepeatCurrent ? 'warning' : 'default'}
          onPress={() => {
            if (!player.repeat) player.setRepeat('all')
            else if (player.isRepeatCurrent) player.setRepeat(null)
            else player.setRepeat('current')
          }}>
          {player.isRepeatCurrent ? <Repeat1Icon className="text-lg" /> : <RepeatIcon className="text-lg" />}
        </Button>

        <Button isIconOnly radius="full" variant="light" size="lg" onPress={player.prev} isDisabled={!player.hasPrev}>
          <SkipBackIcon className="text-xl" />
        </Button>

        <div className="relative">
          {player.error && (
            <Tooltip size="sm" radius="sm" className="bg-danger-100" content={player.error?.message}>
              <div className="absolute inset-0 rounded-full" />
            </Tooltip>
          )}

          <Button
            isIconOnly
            radius="full"
            variant="flat"
            className="size-20"
            color={player.error ? 'danger' : 'secondary'}
            isDisabled={!player.current || !!player.error}
            onPress={player.togglePlay}>
            {player.isPaused ? <PlayIcon className="text-2xl" /> : <PauseIcon className="text-2xl" />}
          </Button>
        </div>

        <Button isIconOnly radius="full" variant="light" size="lg" onPress={player.next} isDisabled={!player.hasNext}>
          <SkipForwardIcon className="text-xl" />
        </Button>

        <Button
          isIconOnly
          radius="full"
          isDisabled={!player.current}
          variant={player.isShuffled ? 'flat' : 'light'}
          color={player.isShuffled ? 'warning' : 'default'}
          onPress={player.toggleShuffle}>
          <ShuffleIcon className="text-lg" />
        </Button>
      </div>
    </div>
  )
}

export function MiniPlayer() {
  return (
    <div
      className="fixed w-160 flex flex-col bottom-6 right-6 border border-default/30
      bg-background/25 backdrop-blur-lg z-50 rounded-small shadow-small overflow-hidden">
      <div className="flex items-center p-2 z-10 gap-1">
        <PictureInPicture2Icon className="text-lg text-default-300 ml-2" />

        {/* // TODO: animate expansion */}
        <Button
          as={Link}
          to="/"
          isIconOnly
          size="sm"
          radius="sm"
          variant="light"
          className="ml-auto"
          onPress={() => setPlayerMaximized(true)}>
          <SquareArrowOutUpLeftIcon className="text-lg text-default-500" />
        </Button>

        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="light"
          color="danger"
          className="text-foreground"
          onPress={() => setMiniPlayerVisibility(false)}>
          <XIcon className="text-lg" />
        </Button>
      </div>

      <Player mini />
    </div>
  )
}
