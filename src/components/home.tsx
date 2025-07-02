import { Player } from '@/player/components'

export function HomeScreen() {
  return (
    <div className="p-3 pt-[calc(theme(spacing.10)+theme(spacing.1))] w-full">
      <Player />
    </div>
  )
}
