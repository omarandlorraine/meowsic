import { createStore, useStore } from 'zustand'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react'
import { CalendarIcon, ClockIcon, Disc3Icon, TagIcon, UserRoundIcon } from 'lucide-react'
import { Cover } from '@/tracks/components'
import { normalizeMeta } from '@/tracks'
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

              <div className="text-default-500 flex items-center gap-2 text-small">
                <ClockIcon /> {meta.duration}
              </div>

              {meta.genre && (
                <div className="text-default-500 flex items-center gap-2 text-small mt-auto">
                  <TagIcon /> {meta.genre}
                </div>
              )}

              {meta.date && (
                <div className="text-default-500 flex items-center gap-2 text-small">
                  <CalendarIcon /> {meta.date}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 py-3">
            <Pair label="Name" value={data?.name} />
            <Pair label="File Path" value={data?.path} />
            <Pair label="Hash" value={data?.hash} />
            <Pair label="Extension" value={data?.extension} />
            {data?.rank && <Pair label="Emotion Rank" value={data.rank} />}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
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
