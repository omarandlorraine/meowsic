import { usePlayer } from '@/player'
import { Button } from '@heroui/react'

export function HomeScreen() {
  const player = usePlayer()

  return (
    <div className="p-16 flex gap-6 self-start">
      <div className="text-xl">ELAPSED: {player.elapsed}</div>

      <Button onPress={() => player.play()}>Play</Button>
      <Button onPress={() => player.pause()}>Pause</Button>
    </div>
  )
}
