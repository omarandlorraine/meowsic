import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useStore } from 'zustand'
import { useDebounce } from 'use-debounce'
import {
  cn,
  Button,
  Card,
  Image,
  CardFooter,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react'
import { CheckIcon, PlayIcon, SmileIcon } from 'lucide-react'
import { DEFAULT_EMOTION, store, setEmotion, setMiniPlayerVisibility, setPlayerMaximized } from '@/settings'
import { usePlayer } from '@/player'
import { getEmotions, getEmotionTracks } from '@/emotions'
import { createSearchIndex } from '@/tracks'
import { SearchBar } from '@/components'
import { ControlsContainer, ListItem, List } from '@/tracks/components'
import type { Track } from '@/tracks'

const searchIndex = createSearchIndex()

export function EmotionScreen() {
  const params = useParams<{ name: string }>()
  const player = usePlayer()

  const query = useQuery({ queryKey: ['emotions'], queryFn: getEmotions })
  const emotion = query.data?.find(it => it.name === params.name)

  const queryPlaylistTracks = useQuery({
    queryKey: ['emotion-tracks', params.name],
    queryFn: async () => await getEmotionTracks(params.name!),
    enabled: !!params.name,
  })

  const map = new Map(queryPlaylistTracks.data?.map(t => [t.hash, t]) ?? [])
  const [filtered, setFiltered] = useState(queryPlaylistTracks.data ?? [])

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) return setFiltered(queryPlaylistTracks.data ?? [])

    const data = searchIndex
      .search(debouncedSearchQuery)
      .map(it => map.get(it.id))
      .filter(Boolean) as Track[]

    setFiltered(data)
  }, [queryPlaylistTracks.data, debouncedSearchQuery])

  useEffect(() => {
    searchIndex.removeAll()
    searchIndex.addAll(queryPlaylistTracks.data ?? [])
  }, [queryPlaylistTracks.data])

  const onPlay = async (data: Track | Track[]) => {
    await player.playTracks(data)
    player.setTemplate('emotions')

    setPlayerMaximized(true)
    setMiniPlayerVisibility(true)
  }

  return (
    <div className="flex flex-col size-full relative">
      <ControlsContainer>
        <Button
          radius="sm"
          variant="flat"
          color="secondary"
          isDisabled={!filtered.length}
          onPress={() => {
            if (filtered.length > 0) onPlay(filtered)
          }}>
          <PlayIcon className="text-lg" /> Play All
        </Button>

        <div
          style={{ '--color': emotion?.color } as React.CSSProperties}
          className="p-2 rounded-full bg-gradient-to-r from-[var(--color)]/10 t0-transparent flex items-center">
          {emotion?.icon && (
            <Image removeWrapper src={`/icons/emotion-${emotion.icon}`} className="size-8 object-cover" />
          )}

          <div className={cn('text-large text-[var(--color)]', emotion ? 'pl-3 pr-6' : 'px-3')}>{params.name}</div>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} className="w-120 ml-auto" />
      </ControlsContainer>

      <List data={filtered}>
        {(item, index, draggableProps) => (
          <ListItem
            key={item.hash}
            index={index}
            data={item}
            onPlay={onPlay}
            isPlaying={player.current === item}
            draggableProps={draggableProps}
          />
        )}
      </List>
    </div>
  )
}

export function EmotionsScreen() {
  const query = useQuery({ queryKey: ['emotions'], queryFn: getEmotions })

  return (
    <>
      <div className="pt-[calc(theme(spacing.10))] overflow-auto w-full flex flex-col h-full gap-2">
        <div className="grid grid-cols-6 p-3 shrink-0 w-full relative gap-3">
          {query.isSuccess &&
            query.data.map(item => (
              <Card
                key={item.name}
                as={Link}
                radius="sm"
                shadow="none"
                to={`/emotions/${item.name}`}
                className="aspect-square bg-[var(--color)]"
                style={{ '--color': item.color } as React.CSSProperties}>
                <Image removeWrapper src={`/icons/emotion-${item.icon}`} className="h-1/3 m-auto" />

                <CardFooter className="absolute bg-background/60 bottom-0 px-3 py-2">
                  <div className="text-small">{item.name}</div>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </>
  )
}

type EmotionSelectProps = { className?: string }

export function EmotionSelect({ className }: EmotionSelectProps) {
  const query = useQuery({ queryKey: ['emotions'], queryFn: getEmotions })
  const items = query.data ?? []

  const current = useStore(store, state => query.data?.find(it => it.name === state.currentEmotion))

  return (
    <Dropdown backdrop="opaque" radius="sm">
      <DropdownTrigger>
        <Button
          isIconOnly
          radius="none"
          variant="light"
          style={{ '--color': current?.color } as React.CSSProperties}
          className={cn(
            current?.name === DEFAULT_EMOTION ? 'text-default-500' : 'text-[var(--color)] bg-[var(--color)]/10',
            className,
          )}>
          <SmileIcon className="text-lg" />
        </Button>
      </DropdownTrigger>

      <DropdownMenu className="w-60">
        {items.map(item => (
          <DropdownItem
            key={item.name}
            textValue={item.name}
            onPress={() => setEmotion(item.name)}
            style={{ '--color': item.color } as React.CSSProperties}
            className={cn(current?.name === item.name && 'bg-[var(--color)]/10')}>
            <div className="flex items-center gap-3">
              <Image removeWrapper src={`/icons/emotion-${item.icon}`} className="size-8 object-cover" />

              <div className="text-[var(--color)]">{item.name}</div>
              {current?.name === item.name && <CheckIcon className="text-lg text-[var(--color)] ml-auto" />}
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
