import { Button } from '@heroui/react'
import { Link, Outlet } from 'react-router'
import { MinusIcon, XIcon } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function Window() {
  const currentWindow = getCurrentWindow()

  return (
    <>
      <div id="title-bar" className="shrink-0 relative z-[1000] p-2 pb-0">
        <div
          data-tauri-drag-region
          className="flex items-center size-full bg-background/70 backdrop-blur-lg rounded-small pointer-events-auto p-2 pl-4">
          <Link to="/" className="text-lg tracking-wider">
            Meowsic
          </Link>

          <div className="flex gap-2 items-center ml-auto">
            <Button isIconOnly variant="light" size="sm" onPress={() => currentWindow.minimize()}>
              <MinusIcon />
            </Button>

            <Button isIconOnly color="danger" variant="light" size="sm" onPress={() => currentWindow.close()}>
              <XIcon />
            </Button>
          </div>
        </div>
      </div>

      <div className="size-full p-6 overflow-auto">
        <div className="size-full rounded-small overflow-hidden">
          <div className="size-full bg-background/70 backdrop-blur-lg rounded-small flex flex-col overflow-auto isolate">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}
