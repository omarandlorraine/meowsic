import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Image, cn } from '@heroui/react'
import { useStore } from 'zustand'
import {
  PictureInPicture2Icon,
  Repeat1Icon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SquareArrowOutUpLeftIcon,
  XIcon,
} from 'lucide-react'
import { formatTime, getAssetUrl } from '@/utils'
import { store, setMiniPlayerVisibility, setPlayerMaximized } from '@/settings'
import { PlayButton, SeekBar } from '@/players'
import { usePlayer } from '@/player'
import { getLyrics, PlainLyricsView, SyncedLyricsView } from '@/lyrics'
import { normalizeMeta } from '@/tracks'
import { AlbumLink, ArtistLink, Cover } from '@/tracks/components/details'

type PlayerProps = { mini?: boolean }

export function Player({ mini }: PlayerProps) {
  const player = usePlayer()
  const meta = normalizeMeta(player.current)
  const isPlayerMaximized = useStore(store, state => state.isPlayerMaximized)

  const queryLyrics = useQuery({
    queryKey: ['lyrics', player.current?.hash],
    queryFn: async () => await getLyrics(player.current!),
    enabled: !!player.current,
  })

  const [showLyrics, setShowLyrics] = useState(false)

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

            {meta.album && <AlbumLink>{meta.album}</AlbumLink>}
            {meta.artist && <ArtistLink>{meta.artist}</ArtistLink>}
          </div>
        </div>
      ) : (
        <>
          {!showLyrics || !queryLyrics.data ? (
            <Cover url={player.current?.cover} className="size-80" />
          ) : !queryLyrics.data.synced ? (
            <PlainLyricsView data={queryLyrics.data.plain} className="size-full" />
          ) : (
            <SyncedLyricsView
              data={queryLyrics.data.synced}
              elapsed={player.elapsed}
              duration={player.current?.duration}
              onSeek={player.seek}
              className="h-80"
            />
          )}

          <div className="flex items-center gap-2 w-4/5 p-3 mt-16">
            {meta.title && <div className="text-large mr-auto">{meta.title}</div>}

            {meta.album && <AlbumLink>{meta.album}</AlbumLink>}
            {meta.artist && <ArtistLink>{meta.artist}</ArtistLink>}

            {queryLyrics.data && (
              <Button
                size="sm"
                radius="sm"
                variant="flat"
                className="tracking-wider h-6"
                onPress={() => setShowLyrics(!showLyrics)}>
                {showLyrics ? 'HIDE' : 'SHOW'} LYRICS
              </Button>
            )}
          </div>
        </>
      )}

      <div className={cn('flex flex-col mx-auto gap-3', mini ? 'w-full p-8' : 'w-4/5 p-3')}>
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

        <PlayButton
          toggle={player.togglePlay}
          current={player.current}
          isPaused={player.isPaused}
          error={player.error}
        />

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
