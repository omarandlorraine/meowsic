import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, useDisclosure } from '@heroui/react'
import { CheckIcon, MoveRightIcon, PlayIcon, PlusIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { useStore } from 'zustand'
import { usePlayer } from '@/player'
import {
  addPlaylist,
  getPlaylists,
  getPlaylistTracks,
  removePlaylist,
  removePlaylistTracks,
  renamePlaylist,
} from '@/playlists'
import { uiStore } from '@/utils'
import { SearchBar, SelectAllControls } from '@/components'
import {
  useTrackSelection,
  TrackListContainer,
  TrackListControlsContainer,
  TrackList,
  TrackListItem,
} from '@/tracks/components'
import type { Track } from '@/tracks'

export function PlaylistScreen() {
  const params = useParams<{ name: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const player = usePlayer()
  const fontSize = useStore(uiStore, state => state.fontSize)

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
  const editorModal = useDisclosure()
  const [editorType, setEditorType] = useState<EditorType | null>(null)

  const onPlay = async (data: Track | Track[]) => {
    await player.setQueue(Array.isArray(data) ? data : [data])
    await player.goto(0)
    await player.play()
    navigate('/')
  }

  const onRemoveTracks = async () => {
    if (!params.name || !queryPlaylistTracks.isSuccess) return

    await removePlaylistTracks(params.name, selection.values)
    await queryPlaylistTracks.refetch()

    selection.clear()
  }

  return (
    <>
      <TrackListContainer ref={containerRef}>
        <TrackListControlsContainer>
          {selection.values.length > 0 ? (
            <>
              {queryPlaylistTracks.isSuccess && (
                <SelectAllControls data={queryPlaylistTracks.data} selection={selection} />
              )}

              <Button radius="sm" variant="flat" color="danger" className="!text-foreground" onPress={onRemoveTracks}>
                <Trash2Icon className="text-lg" /> Remove Selected
              </Button>
            </>
          ) : (
            <>
              <Button
                radius="sm"
                variant="flat"
                color="secondary"
                isDisabled={!queryPlaylistTracks.isSuccess || !queryPlaylistTracks.data.length}
                onPress={() => {
                  if (queryPlaylistTracks.isSuccess && queryPlaylistTracks.data.length > 0)
                    onPlay(queryPlaylistTracks.data)
                }}>
                <PlayIcon className="text-lg" /> Play All
              </Button>

              <div className="text-large px-6 border-x border-default/30">{params.name}</div>

              <Button
                radius="sm"
                variant="flat"
                size="sm"
                onPress={() => {
                  setEditorType('update')
                  editorModal.onOpen()
                }}>
                <SquarePenIcon className="text-medium text-default-500" /> Edit
              </Button>

              <Button
                radius="sm"
                variant="flat"
                color="danger"
                size="sm"
                className="!text-foreground"
                onPress={() => {
                  setEditorType('remove')
                  editorModal.onOpen()
                }}>
                <Trash2Icon className="text-medium" /> Remove
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

      {params.name && (
        <>
          <PlaylistEditorModal
            type="remove"
            isOpen={editorModal.isOpen && editorType === 'remove'}
            onOpenChange={editorModal.onOpenChange}
            existing={params.name}
            onAction={async name => {
              await removePlaylist(name)
              await queryClient.invalidateQueries({ queryKey: ['playlists'] })

              navigate('/playlists')
            }}
          />

          <PlaylistEditorModal
            type="update"
            isOpen={editorModal.isOpen && editorType === 'update'}
            onOpenChange={editorModal.onOpenChange}
            existing={params.name}
            onAction={async newName => {
              if (!params.name) return
              await renamePlaylist(params.name, newName)

              editorModal.onClose()
              navigate(`/playlists/${newName}`)
            }}
          />
        </>
      )}
    </>
  )
}

export function PlaylistsScreen() {
  const query = useQuery({ queryKey: ['playlists'], queryFn: getPlaylists })
  const editorModal = useDisclosure()

  return (
    <>
      <div className="pt-[calc(theme(spacing.10)+theme(spacing.2))] overflow-auto w-full flex flex-col h-full gap-2">
        <div
          className="px-6 py-3 flex items-center gap-3 rounded-small
          sticky top-0 inset-x-0 bg-default-50/25 backdrop-blur-lg z-50 backdrop-saturate-125">
          <Button radius="sm" variant="flat" onPress={editorModal.onOpen}>
            <PlusIcon className="text-lg" /> Create New
          </Button>
        </div>

        <div className="flex flex-col px-3 shrink-0 w-full relative gap-1">
          {query.isSuccess &&
            query.data.map(name => (
              <div key={name} className="flex items-center px-3">
                <Button
                  as={Link}
                  to={`/playlists/${name}`}
                  size="lg"
                  radius="sm"
                  variant="light"
                  color="secondary"
                  className="!text-foreground">
                  {name} <MoveRightIcon className="text-lg ml-2" />
                </Button>
              </div>
            ))}
        </div>
      </div>

      <PlaylistEditorModal
        type="new"
        isOpen={editorModal.isOpen}
        onOpenChange={editorModal.onOpenChange}
        onAction={async name => {
          await addPlaylist(name)
          await query.refetch()
          editorModal.onClose()
        }}
      />
    </>
  )
}

type EditorType = 'new' | 'update' | 'remove'

type PlaylistEditorModalProps = {
  type: EditorType
  isOpen?: boolean
  onOpenChange: (value: boolean) => void
  onAction: (name: string) => void
  existing?: string | null
}

export function PlaylistEditorModal({ isOpen, onOpenChange, existing, type, onAction }: PlaylistEditorModalProps) {
  const [name, setName] = useState(existing ?? '')

  return (
    <Modal isOpen={isOpen} placement="bottom-center" backdrop="blur" radius="sm" onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          {type === 'new' ? 'New Playlist' : type === 'update' ? 'Edit Playlist' : 'Remove Playlist'}
        </ModalHeader>

        <ModalBody>
          {type === 'remove' ? (
            <p className="text-default-500">Are you sure you want to remove this playlist?</p>
          ) : (
            <Input
              variant="flat"
              radius="sm"
              label="Name"
              value={name}
              onValueChange={setName}
              onClear={() => setName('')}
              placeholder="Name of the playlist"
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            radius="sm"
            variant="flat"
            onPress={() => onAction(name)}
            color={type === 'remove' ? 'danger' : 'success'}
            isDisabled={!name.trim() || (type === 'update' && name === existing)}>
            <CheckIcon className="text-lg" /> {type === 'remove' ? 'Remove' : type === 'new' ? 'Create' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
