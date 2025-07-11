import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { createStore, useStore } from 'zustand'
import { Modal, ModalContent, ModalHeader, ModalBody, cn, Image, ModalFooter, Button } from '@heroui/react'
import { CalendarIcon, ClockIcon, Disc3Icon, MusicIcon, TagIcon, UserRoundIcon } from 'lucide-react'
import { getAssetUrl } from '@/utils'
import { normalizeMeta } from '@/tracks'
import { usePlayer } from '@/player'
import { Player } from '@/player/components'
import type { LucideIcon } from 'lucide-react'
import type { Track } from '@/tracks'

export function TrackDetailsModal() {
  const { data, hide } = useTrackDetails()
  const meta = normalizeMeta(data)

  return (
    <Modal isOpen={!!data} onClose={hide} placement="bottom-center" backdrop="blur" radius="sm" size="3xl">
      <ModalContent>
        <ModalHeader>Track Details</ModalHeader>

        <ModalBody className="flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <Cover url={data?.cover} className="size-60 shrink-0" />

            <div className="flex flex-col gap-2">
              {meta.title && <div className="text-large">{meta.title}</div>}

              {meta.album && <AlbumLink onClick={hide}>{meta.album}</AlbumLink>}
              {meta.artist && <ArtistLink onClick={hide}>{meta.artist}</ArtistLink>}

              <PropertyText className="mb-auto">
                <ClockIcon /> {meta.duration}
              </PropertyText>

              {meta.genre && (
                <PropertyText>
                  <TagIcon /> {meta.genre}
                </PropertyText>
              )}

              {meta.date && (
                <PropertyText>
                  <CalendarIcon /> {meta.date}
                </PropertyText>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 py-3">
            <Pair label="File Name" value={data?.name} />
            <Pair label="File Path" value={data?.path} />
            <Pair label="Hash" value={data?.hash} />
            <Pair label="Extension" value={data?.extension} />
            {data?.rank && <Pair label="Emotion Rank" value={data.rank} />}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button as={Link} radius="sm" variant="flat" isDisabled={!data} to={`/tracks/${data?.hash}`} onPress={hide}>
            Manage
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

type CoverProps = {
  url?: string | null
  className?: string
  placeholder?: LucideIcon | (() => React.ReactNode)
  external?: boolean
  onClick?: () => void
}

export function Cover({ url, className, placeholder: Placeholder = MusicIcon, external, onClick }: CoverProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      {...(onClick && { type: 'button', onClick, disabled: !onClick })}
      className={cn('rounded-small overflow-hidden', onClick && 'cursor-pointer', className)}>
      {url ? (
        <Image
          isBlurred
          radius="none"
          shadow="none"
          width="100%"
          height="100%"
          loading="lazy"
          src={external ? url : getAssetUrl(url)}
          classNames={{ wrapper: 'size-full', img: 'size-full object-contain' }}
        />
      ) : (
        <div className="size-full grid place-items-center bg-radial from-secondary-50/75 to-default-50/25">
          <Placeholder className="size-1/3 text-secondary-800 opacity-80" />
        </div>
      )}
    </Component>
  )
}

type PropertyTextProps = { link?: string; children: React.ReactNode; className?: string; onClick?: () => void }

export function PropertyText({ link, children, className, onClick }: PropertyTextProps) {
  const Component = link ? Link : 'div'

  return (
    <Component
      to={link ?? ''}
      onClick={onClick}
      className={cn(
        'text-default-500 flex items-center gap-2 text-small',
        link && 'hover:text-secondary-700 transition-colors cursor-pointer',
        className,
      )}>
      {children}
    </Component>
  )
}

export function AlbumLink({ children, ...props }: PropertyTextProps) {
  return (
    <PropertyText {...props} link={`/tracks?album=${children}`}>
      <Disc3Icon /> {children}
    </PropertyText>
  )
}

export function ArtistLink({ children, ...props }: PropertyTextProps) {
  return (
    <PropertyText {...props} link={`/tracks?artist=${children}`}>
      <UserRoundIcon /> {children}
    </PropertyText>
  )
}

type PairProps = { label: string; value?: string | number | null }

function Pair({ label, value }: PairProps) {
  return (
    <div className="flex items-center text-default-500 text-tiny">
      <div className="w-36 shrink-0">{label}</div>
      <div>{value ?? '-'}</div>
    </div>
  )
}

const store = createStore<Track | null>(() => null)

export function useTrackDetails() {
  const state = useStore(store)

  return {
    data: state,
    show: (data: Track) => store.setState(data),
    hide: () => store.setState(null),
  }
}

export function TrackScreen() {
  const params = useParams<{ hash: string }>()
  const player = usePlayer()

  const query = useQuery({
    queryKey: ['track', params.hash],
    queryFn: async () => await getTrack(params.hash!),
    enabled: !!params.hash,
  })

  useEffect(() => {
    ;(async () => {
      if (!query.data) return

      const queue = [query.data]
      await player.setQueue(queue)

      player.setState({ queue, repeat: 'current' })
      await player.goto(0)
    })()
  }, [query.data])

  return (
    <div className="pt-[calc(theme(spacing.10))] overflow-auto size-full flex flex-col">
      {query.isSuccess && query.data && (
        <div className="p-3 flex flex-col gap-3">
          <div className="w-1/2 mx-auto">
            <Player mini scrubber />
          </div>
        </div>
      )}
    </div>
  )
}

async function getTrack(hash: string) {
  return await invoke<Track | null>('db_get_track', { hash })
}
