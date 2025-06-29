import { useLayoutEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Link, useNavigate, useParams } from 'react-router'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react'
import { MoveRightIcon, PenIcon, PenLineIcon, PlayIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { useStore } from 'zustand'
import { usePlayer } from '@/player'
import { getPlaylists, getPlaylistTracks } from '@/playlists'
import { uiStore } from '@/utils'
import { SearchBar, SelectAllControls } from '@/components'
import {
  useTrackSelection,
  TrackListContainer,
  TrackListControlsContainer,
  TrackList,
  TrackListItem,
} from '@/tracks/components'
import { Track } from '@/tracks'

export function PlaylistScreen() {
  const navigate = useNavigate()
  const player = usePlayer()
  const fontSize = useStore(uiStore, state => state.fontSize)

  const params = useParams<{ name: string }>()

  const queryPlaylistTracks = useQuery({
    enabled: !!params.name,
    queryKey: ['playlist-tracks', params.name],
    queryFn: async () => {
      if (!params.name) throw new Error('Missing playlist name')
      return getPlaylistTracks(params.name)
    },
  })

  const containerRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    enabled: queryPlaylistTracks.isSuccess,
    count: queryPlaylistTracks.data?.length ?? 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => fontSize * 5.5 + 1, // height of cover + padding-y + 1px border
    overscan: 5,
  })

  useLayoutEffect(() => {
    virtualizer.measure()
  }, [fontSize])

  const selection = useTrackSelection()

  const onPlay = async (data: Track | Track[]) => {
    await player.setQueue(Array.isArray(data) ? data : [data])
    await player.goto(0)
    await player.play()
    navigate('/')
  }

  return (
    <TrackListContainer ref={containerRef}>
      <TrackListControlsContainer>
        {selection.values.length > 0 ? (
          <>
            {queryPlaylistTracks.isSuccess && (
              <SelectAllControls data={queryPlaylistTracks.data} selection={selection} />
            )}
          </>
        ) : (
          <>
            <Button
              radius="sm"
              variant="flat"
              color="secondary"
              isDisabled={!queryPlaylistTracks.isSuccess}
              onPress={() => {
                if (queryPlaylistTracks.isSuccess) onPlay(queryPlaylistTracks.data)
              }}>
              <PlayIcon className="text-lg" /> Play All
            </Button>

            <Button radius="sm" variant="light" className="text-medium" onPress={() => {}}>
              {params.name} <SquarePenIcon className="text-default-400" />
            </Button>

            <SearchBar value="" onChange={() => {}} />
          </>
        )}
      </TrackListControlsContainer>

      {queryPlaylistTracks.isSuccess && (
        <TrackList height={virtualizer.getTotalSize()}>
          {virtualizer.getVirtualItems().map(item => {
            const track = queryPlaylistTracks.data[item.index]

            return (
              <TrackListItem
                key={track.hash}
                data={track}
                virtualItem={item}
                isSelected={selection.isSelected(track)}
                isPlaying={player.current?.hash === track.hash}
                onToggleSelect={selection.toggle}
                onPlay={async () => {
                  await player.goto(item.index)
                  await player.play()
                }}
              />
            )
          })}
        </TrackList>
      )}
    </TrackListContainer>
  )
}

export function PlaylistsScreen() {
  const queryPlaylists = useQuery({ queryKey: ['playlists'], queryFn: getPlaylists })
  const playlists = queryPlaylists.isSuccess ? queryPlaylists.data : []

  return (
    <div className="p-6 pt-[calc(theme(spacing.10)+theme(spacing.3))] overflow-auto w-full flex flex-col h-full gap-2">
      {playlists.map(name => (
        <div key={name} className="flex items-center gap-3">
          <Button isIconOnly radius="full" variant="flat" color="warning" onPress={() => {}}>
            <PlayIcon className="text-lg" />
          </Button>

          <Button as={Link} to={`/playlists/${name}`} radius="sm" variant="light" size="lg">
            {name} <MoveRightIcon className="text-lg" />
          </Button>
        </div>
      ))}
    </div>
  )
}

type PlaylistEditorModalProps = {
  dataToEdit?: string | null
  isOpen?: boolean
  onOpenChange: (value: boolean) => void
  onSave: (name: string) => void
}

export function PlaylistEditorModal({ isOpen, onOpenChange, dataToEdit, onSave }: PlaylistEditorModalProps) {
  const [name, setName] = useState(dataToEdit ?? '')

  return (
    <Modal isOpen={isOpen} placement="bottom-center" backdrop="blur" radius="sm" onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Playlist</ModalHeader>

        <ModalBody>
          <Input
            variant="flat"
            radius="sm"
            label="Name"
            value={name}
            onValueChange={setName}
            onClear={() => setName('')}
            placeholder="Name of the playlist"
          />
        </ModalBody>

        <ModalFooter>
          <Button color="success" radius="sm" variant="flat" onPress={() => onSave(name)} isDisabled={!name.trim()}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
