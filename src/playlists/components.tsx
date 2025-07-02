import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, useDisclosure } from '@heroui/react'
import { CheckIcon, MoveRightIcon, PlayIcon, PlusIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { reorder } from '@/utils'
import { usePlayer } from '@/player'
import {
  addPlaylist,
  getPlaylists,
  getPlaylistTracks,
  removePlaylist,
  removePlaylistTracks,
  renamePlaylist,
  reorderPlaylistTrack,
} from '@/playlists'
import { SearchBar, SelectAllControls } from '@/components'
import { useTrackSelection, ControlsContainer, ListItem, List } from '@/tracks/components'
import type { DropResult } from '@hello-pangea/dnd'
import type { Track } from '@/tracks'

export function PlaylistScreen() {
  const params = useParams<{ name: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const player = usePlayer()
  const selection = useTrackSelection()
  const editorModal = useDisclosure()
  const [editorType, setEditorType] = useState<EditorType | null>(null)

  const queryPlaylistTracks = useQuery({
    queryKey: ['playlist-tracks', params.name],
    queryFn: async () => await getPlaylistTracks(params.name!),
    enabled: !!params.name,
  })

  const [tracks, setTracks] = useState(queryPlaylistTracks.data ?? [])

  useEffect(() => setTracks(queryPlaylistTracks.data ?? []), [queryPlaylistTracks.data])

  const onDragEnd = async (result: DropResult) => {
    if (!params.name || !result.destination) return

    const src = result.source.index
    const dst = result.destination.index
    if (src === dst) return

    setTracks(state => reorder(state, src, dst))
    await reorderPlaylistTrack(params.name, tracks[src], src, dst)
  }

  const onPlay = async (data: Track | Track[]) => {
    await player.setQueue(Array.isArray(data) ? data : [data])
    await player.goto(0)
    await player.play()
    navigate('/')
  }

  const onRemoveTracks = async () => {
    if (!params.name || !selection.values.length) return

    await removePlaylistTracks(params.name, selection.values)
    await queryPlaylistTracks.refetch()

    selection.clear()
  }

  return (
    <div className="flex flex-col size-full relative">
      <ControlsContainer>
        {selection.values.length > 0 ? (
          <>
            <SelectAllControls data={tracks} selection={selection} />

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
              isDisabled={!tracks.length}
              onPress={() => {
                if (tracks.length > 0) onPlay(tracks)
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
      </ControlsContainer>

      <List data={tracks} onDragEnd={onDragEnd}>
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
    </div>
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
            <div className="text-default-500">Are you sure you want to remove this playlist?</div>
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
