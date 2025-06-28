import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Checkbox,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Image,
  Input,
} from '@heroui/react'
import {
  AudioLinesIcon,
  ClockIcon,
  Disc3Icon,
  ListMusicIcon,
  ListVideoIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { formatTime, getAssetUrl } from '@/utils'
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

  const [selected, setSelected] = useState<Track[]>([])

  const playlists: string[] = []

  return (
    <div className="pt-[calc(theme(spacing.10)+theme(spacing.1))] overflow-auto w-full flex flex-col relative">
      <div className="px-6 py-2 flex items-center gap-3 sticky top-0 inset-x-0 bg-default-50/25 backdrop-blur-lg z-50 rounded-small">
        {selected.length > 0 ? (
          <>
            {query.isSuccess && (
              <div className="flex items-center gap-2 w-44">
                <Checkbox
                  color="success"
                  radius="full"
                  isSelected={selected.length === query.data.length}
                  onValueChange={() => {
                    if (selected.length === query.data.length) return setSelected([])
                    setSelected(query.data)
                  }}
                />

                <Button
                  size="sm"
                  radius="sm"
                  color="danger"
                  variant="flat"
                  className="!text-foreground"
                  onPress={() => setSelected([])}>
                  {selected.length} selected <XIcon className="text-medium" />
                </Button>
              </div>
            )}

            <Button radius="sm" variant="flat" color="secondary">
              <PlayIcon className="text-lg" /> Play
            </Button>

            <Button radius="sm" variant="flat">
              <ListVideoIcon className="text-lg" /> Add to Queue
            </Button>

            <Dropdown radius="sm" backdrop="opaque">
              <DropdownTrigger>
                <Button radius="sm" variant="flat">
                  <PlusIcon className="text-lg" /> Add to Playlist
                </Button>
              </DropdownTrigger>

              <DropdownMenu variant="flat">
                <DropdownSection showDivider={playlists.length > 0} className={cn(!playlists.length && 'mb-0')}>
                  <DropdownItem key="new" startContent={<ListMusicIcon className="text-lg" />}>
                    New Playlist
                  </DropdownItem>
                </DropdownSection>

                <DropdownSection className="mb-0">
                  {playlists.map(playlist => (
                    <DropdownItem key={playlist}>{playlist}</DropdownItem>
                  ))}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </>
        ) : (
          <>
            <Button
              radius="sm"
              variant="flat"
              color="secondary"
              onPress={async () => await player.setQueue(query.data ?? [])}>
              <PlayIcon className="text-lg" /> Play All
            </Button>

            <Input
              radius="sm"
              variant="flat"
              placeholder="Search"
              startContent={<SearchIcon className="text-lg flex-shrink-0 mr-1" />}
              classNames={{
                base: 'w-160 ml-auto',
                input: 'bg-transparent placeholder:text-default-300',
                innerWrapper: 'bg-transparent',
                inputWrapper: [
                  'dark:bg-default/30',
                  'dark:hover:bg-default/40',
                  'dark:group-data-[focus=true]:bg-default/40',
                ],
              }}
            />
          </>
        )}
      </div>

      {query.isSuccess && (
        <div className="flex flex-col gap-1 divide-y divide-default/30 px-3">
          {query.data.map(track => {
            return (
              <TrackListItem
                key={track.hash}
                data={track}
                isPlaying={player.current?.hash === track.hash}
                isSelected={selected.includes(track)}
                onSelect={() =>
                  setSelected(selected.includes(track) ? selected.filter(t => t !== track) : [...selected, track])
                }
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

type TrackListItemProps = {
  data: Track
  isPlaying?: boolean
  isSelected?: boolean
  onPlay?: () => void
  onSelect?: () => void
}

export function TrackListItem({ data, isPlaying, isSelected, onPlay, onSelect }: TrackListItemProps) {
  const meta = normalizeMeta(data)

  return (
    <div className="flex items-center gap-3 p-3">
      <Checkbox color="success" radius="full" isSelected={isSelected} onValueChange={onSelect} />

      {onPlay && (
        <Button isIconOnly radius="full" variant="flat" onPress={onPlay}>
          <PlayIcon className="text-lg" />
        </Button>
      )}

      <Cover url={data.cover} className="size-16 mx-3" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {isPlaying && <AudioLinesIcon className="text-lg text-secondary-600" />}

          {meta.title}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-default-500 flex items-center gap-2 text-small">
            <ClockIcon /> {formatTime(data.duration)}
          </div>

          {meta.album && meta.artist && (
            <>
              <div className="text-default-500 flex items-center gap-2 text-small pl-2 border-l border-default/30">
                <Disc3Icon /> {meta.album}
              </div>

              <div className="text-default-500 flex items-center gap-2 text-small">
                <UserRoundIcon /> {meta.artist}
              </div>
            </>
          )}
        </div>
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
