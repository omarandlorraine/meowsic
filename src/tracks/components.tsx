import { memo, useEffect, useState } from 'react'
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
  useDisclosure,
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
  UserRoundIcon,
} from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { formatTime, getAssetUrl, useSelection } from '@/utils'
import { usePlayer } from '@/player'
import { getTracks, normalizeMeta } from '@/tracks'
import { addPlaylist, addPlaylistTracks, getPlaylists } from '@/playlists'
import { SearchBar, SelectAllControls } from '@/components'
import { PlaylistEditorModal } from '@/playlists/components'
import type { ItemProps as VirtuosoItemProps, ContextProp as VirtuosoContextProps } from 'react-virtuoso'
import type { DraggableProvided, DraggableStateSnapshot, DropResult, DraggableRubric } from '@hello-pangea/dnd'
import type { Track } from '@/tracks'

export function TracksScreen() {
  const navigate = useNavigate()
  const player = usePlayer()

  const query = useQuery({ queryKey: ['tracks'], queryFn: getTracks })
  const [tracks, setTracks] = useState(query.data ?? [])

  useEffect(() => setTracks(query.data ?? []), [query.data])

  const onPlay = async (data: Track | Track[]) => {
    await player.setQueue(Array.isArray(data) ? data : [data])
    await player.goto(0)
    await player.play()
    navigate('/')
  }

  const selection = useTrackSelection()
  const playlistEditorModal = useDisclosure()

  const queryPlaylists = useQuery({ queryKey: ['playlists'], queryFn: getPlaylists })
  const playlists = queryPlaylists.data ?? []

  return (
    <div className="flex flex-col size-full relative">
      <ControlsContainer>
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
                  <DropdownItem
                    key="new"
                    startContent={<ListMusicIcon className="text-lg" />}
                    onPress={playlistEditorModal.onOpen}>
                    New Playlist
                  </DropdownItem>
                </DropdownSection>

                <DropdownSection className="mb-0">
                  {playlists.map(name => (
                    <DropdownItem
                      key={name}
                      onPress={async () => {
                        await addPlaylistTracks(name, selection.values)

                        selection.clear()
                        navigate(`/playlists/${name}`)
                      }}>
                      {name}
                    </DropdownItem>
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
              isDisabled={!query.isSuccess || !query.data.length}
              onPress={() => {
                if (query.isSuccess && query.data.length > 0) onPlay(query.data)
              }}>
              <PlayIcon className="text-lg" /> Play All
            </Button>

            <SearchBar value="" onChange={() => {}} />
          </>
        )}
      </ControlsContainer>

      <List data={tracks}>
        {(item, index, draggableProps) => (
          <ListItem
            key={item.hash}
            index={index}
            data={item}
            onPlay={onPlay}
            isSelected={selection.isSelected(item)}
            isPlaying={player.current?.hash === item.hash}
            onToggleSelect={selection.toggle}
            draggableProps={draggableProps}
          />
        )}
      </List>

      <PlaylistEditorModal
        type="new"
        isOpen={playlistEditorModal.isOpen}
        onOpenChange={playlistEditorModal.onOpenChange}
        onAction={async name => {
          await addPlaylist(name)
          await addPlaylistTracks(name, selection.values)

          playlistEditorModal.onClose()
          selection.clear()
          navigate(`/playlists/${name}`)
        }}
      />
    </div>
  )
}

type ListProps = {
  data: Track[]
  onDragEnd?: (result: DropResult) => void
  children: (item: Track, index: number, draggableProps: DraggableProps) => React.ReactNode
}

export function List({ data, children, onDragEnd }: ListProps) {
  const renderClone = (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubric: DraggableRubric) => (
    <ListItem data={data[rubric.source.index]} draggableProps={{ provided, snapshot }} />
  )

  return (
    <DragDropContext onDragEnd={onDragEnd ?? (() => {})}>
      <Droppable mode="virtual" droppableId="droppable" renderClone={renderClone}>
        {provided => {
          const ref = (el: Window | HTMLElement | null) => provided.innerRef(el as HTMLElement)

          return (
            <Virtuoso
              scrollerRef={ref}
              data={data}
              overscan={5}
              className="size-full shrink-0"
              components={{ Item: VirtualItem, List: VirtualList, Header: VirtualHeader }}
              itemContent={(index, item) => {
                return (
                  <Draggable draggableId={item.hash} index={index} key={item.hash} isDragDisabled={!onDragEnd}>
                    {(provided, snapshot) => children(item, index, { provided, snapshot })}
                  </Draggable>
                )
              }}
            />
          )
        }}
      </Droppable>
    </DragDropContext>
  )
}

type DraggableProps = { provided: DraggableProvided; snapshot: DraggableStateSnapshot }

type ListItemProps = {
  data: Track
  isPlaying?: boolean
  isSelected?: boolean
  onPlay?: (data: Track) => void
  onToggleSelect?: (data: Track, previouslySelected?: boolean) => void
  index?: number
  draggableProps?: DraggableProps
}

export const ListItem = memo(
  ({ data, isPlaying, isSelected, onPlay, onToggleSelect, draggableProps }: ListItemProps) => {
    const meta = normalizeMeta(data)

    return (
      <div
        ref={draggableProps?.provided.innerRef}
        {...draggableProps?.provided.draggableProps}
        {...draggableProps?.provided.dragHandleProps}
        style={draggableProps?.provided.draggableProps.style}
        className={cn(
          'flex items-center gap-3 p-3',
          draggableProps?.snapshot.isDragging &&
            'bg-secondary-50/25 border-secondary/10 border saturate-125 backdrop-blur-lg rounded-small',
        )}>
        <Checkbox
          color="success"
          radius="full"
          isSelected={isSelected}
          isDisabled={draggableProps?.snapshot.isDragging}
          onValueChange={() => {
            if (onToggleSelect) onToggleSelect(data, isSelected)
          }}
        />

        <Button isIconOnly radius="full" variant="flat" isDisabled={!onPlay} onPress={() => onPlay?.(data)}>
          <PlayIcon className="text-lg" />
        </Button>

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
    prev.index === next.index &&
    prev.draggableProps === next.draggableProps,
)

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

export function ControlsContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'px-6 py-3 flex items-center gap-3 rounded-small absolute top-[calc(theme(spacing.10)+theme(spacing.2))] left-0 right-3',
        'bg-default-50/25 backdrop-blur-lg z-50 backdrop-saturate-125',
        className,
      )}
    />
  )
}

function VirtualItem({ item, ...props }: VirtuosoItemProps<Track>) {
  // needed to preserve height
  const [size, setSize] = useState(0)
  const knownSize = props['data-known-size']

  useEffect(() => {
    if (knownSize) setSize(knownSize)
  }, [knownSize])

  return (
    <div
      {...props}
      style={{ ...props.style, '--item-height': `${size}px` } as React.CSSProperties}
      className="empty:min-h-[var(--item-height)] empty:box-border"
    />
  )
}

function VirtualList(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className="flex flex-col gap-1 px-3 shrink-0 w-full divide-y divide-default/30" />
}

function VirtualHeader(props: VirtuosoContextProps<Track>) {
  return <div {...props} className="h-[calc(theme(spacing.10)+theme(spacing.16)+theme(spacing.4))]" />
}

export function useTrackSelection() {
  return useSelection<Track>((a, b) => a === b) // compare by reference
}

// Virtuoso's resize observer can throw this error, which is caught by DnD and aborts dragging.
window.addEventListener('error', evt => {
  if (
    evt.message === 'ResizeObserver loop completed with undelivered notifications.' ||
    evt.message === 'ResizeObserver loop limit exceeded'
  ) {
    evt.stopImmediatePropagation()
  }
})
