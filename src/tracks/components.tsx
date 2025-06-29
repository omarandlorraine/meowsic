import { memo, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual'
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
import { useStore } from 'zustand'
import { formatTime, getAssetUrl, uiStore, useSelection } from '@/utils'
import { usePlayer } from '@/player'
import { getTracks, normalizeMeta } from '@/tracks'
import type { Track } from '@/tracks'
import type { UseSelection } from '@/utils'

export function TracksScreen() {
  const navigate = useNavigate()
  const player = usePlayer()
  const fontSize = useStore(uiStore, state => state.fontSize)

  const query = useQuery({ queryKey: ['tracks'], queryFn: getTracks })

  const containerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    enabled: query.isSuccess,
    count: query.data?.length ?? 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => fontSize * 5.5 + 1, // height of cover + padding-y + 1px border
    overscan: 5,
  })

  useLayoutEffect(() => {
    virtualizer.measure()
  }, [fontSize])

  const onPlay = async (data: Track | Track[]) => {
    await player.setQueue(Array.isArray(data) ? data : [data])
    await player.goto(0)
    await player.play()
    navigate('/')
  }

  const selection = useTrackSelection()

  const playlists: string[] = []

  return (
    <TrackListContainer ref={containerRef}>
      <TrackListControlsContainer>
        {selection.values.length > 0 ? (
          <>
            {query.isSuccess && <SelectAllControls data={query.data} selection={selection} />}

            <Button radius="sm" variant="flat" color="secondary" onPress={() => onPlay(selection.values)}>
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
              isDisabled={!query.isSuccess}
              onPress={() => {
                if (query.isSuccess) onPlay(query.data)
              }}>
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
      </TrackListControlsContainer>

      {query.isSuccess && (
        <TrackList height={virtualizer.getTotalSize()}>
          {virtualizer.getVirtualItems().map(item => {
            const track = query.data[item.index]

            return (
              <TrackListItem
                key={track.hash}
                data={track}
                onPlay={onPlay}
                virtualItem={item}
                isSelected={selection.isSelected(track)}
                isPlaying={player.current?.hash === track.hash}
                onToggleSelect={selection.toggle}
              />
            )
          })}
        </TrackList>
      )}
    </TrackListContainer>
  )
}

export function useTrackSelection() {
  return useSelection<Track>((a, b) => a === b) // compare by reference
}

type TrackListProps = { children: React.ReactNode; className?: string; height?: number }

export function TrackList({ children, className, height }: TrackListProps) {
  return (
    <div
      style={height ? { height } : {}}
      className={cn('flex flex-col gap-1 divide-y divide-default/30 px-3 shrink-0 w-full relative', className)}>
      {children}
    </div>
  )
}

type TrackListContainerProps = {
  ref: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
  className?: string
}

export function TrackListContainer({ ref, children, className }: TrackListContainerProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'pt-[calc(theme(spacing.10)+theme(spacing.1))] overflow-auto w-full flex flex-col relative h-full',
        className,
      )}>
      {children}
    </div>
  )
}

type TrackListItemProps = {
  data: Track
  isPlaying?: boolean
  isSelected?: boolean
  virtualItem?: VirtualItem
  onPlay?: (data: Track) => void
  onToggleSelect?: (data: Track, previouslySelected?: boolean) => void
}

export const TrackListItem = memo(
  ({ data, isPlaying, isSelected, onPlay, onToggleSelect, virtualItem }: TrackListItemProps) => {
    const meta = normalizeMeta(data)

    return (
      <div
        className={cn('flex items-center gap-3 p-3', virtualItem && 'absolute top-0 inset-x-3')}
        style={virtualItem ? { height: virtualItem.size, transform: `translateY(${virtualItem.start}px)` } : {}}>
        {/* ! THIS CHECKBOX CAN CAUSE LAGS */}
        <Checkbox
          color="success"
          radius="full"
          isSelected={isSelected}
          onValueChange={() => {
            if (onToggleSelect) onToggleSelect(data, isSelected)
          }}
        />

        {onPlay && (
          <Button isIconOnly radius="full" variant="flat" onPress={() => onPlay(data)}>
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
  },
  (prev, next) =>
    prev.data.hash === next.data.hash &&
    prev.isSelected === next.isSelected &&
    prev.isPlaying === next.isPlaying &&
    prev.virtualItem === next.virtualItem,
)

type TrackListControlsContainerProps = { children: React.ReactNode; className?: string }

export function TrackListControlsContainer({ children, className }: TrackListControlsContainerProps) {
  return (
    <div
      className={cn(
        'px-6 py-2 flex items-center gap-3 sticky top-0 inset-x-0 bg-default-50/25 backdrop-blur-lg z-50 rounded-small',
        className,
      )}>
      {children}
    </div>
  )
}

type SelectAllControlsProps<T> = { data: T[]; selection: UseSelection<T> }

export function SelectAllControls({ selection, data }: SelectAllControlsProps<Track>) {
  return (
    <div className="flex items-center gap-2" style={{ width: `calc(${data.length.toString().length}ch + 6rem)` }}>
      <Checkbox
        color="success"
        radius="full"
        isSelected={selection.values.length === data.length}
        onValueChange={() => {
          if (selection.values.length === data.length) return selection.clear()
          selection.set(data)
        }}
      />

      <Button
        size="sm"
        radius="sm"
        color="danger"
        variant="flat"
        className="!text-foreground shrink-0 font-mono"
        onPress={selection.clear}>
        {selection.values.length} <XIcon className="text-medium" />
      </Button>
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
