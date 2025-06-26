import { Button } from '@heroui/react'
import { invoke } from '@tauri-apps/api/core'

export function HomeScreen() {
  return (
    <div className="p-6 flex gap-6 self-start">
      {/* <Button
        onPress={() => {
          invoke('play')
        }}>
        Play
      </Button>

      <Button
        onPress={() => {
          invoke('pause')
        }}>
        Pause
      </Button> */}
    </div>
  )
}
