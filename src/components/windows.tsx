import { useEffect, useRef, useState } from 'react'
import { Button, cn } from '@heroui/react'
import { Link, Outlet } from 'react-router'
import { MinusIcon, MoveDiagonalIcon, XIcon } from 'lucide-react'
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
            Mirage
          </Link>

          <div className="flex gap-2 items-center ml-auto">
            <Button isIconOnly variant="light" size="sm" onPress={() => currentWindow.minimize()}>
              <MinusIcon />
            </Button>

            <Button isIconOnly color="danger" variant="light" size="sm" onPress={() => currentWindow.hide()}>
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

export function WidgetWindow() {
  const currentWindow = getCurrentWindow()
  const [resizable, setResizable] = useState(false)

  useEffect(() => {
    ;(async () => {
      setResizable(await currentWindow.isResizable())
    })()
  }, [])

  const ref = useRef<HTMLDivElement>(null)
  const [showTitleBar, setShowTitleBar] = useState(false)

  useEffect(() => {
    function onMouseEnter() {
      setShowTitleBar(true)
    }

    function onMouseLeave() {
      setShowTitleBar(false)
    }

    ref.current?.addEventListener('mouseenter', onMouseEnter)
    ref.current?.addEventListener('mouseleave', onMouseLeave)

    return () => {
      ref.current?.removeEventListener('mouseenter', onMouseEnter)
      ref.current?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'size-full flex flex-col rounded-small border-2',
        resizable ? 'border-primary-500' : 'border-transparent',
      )}>
      <div
        id="title-bar"
        data-tauri-drag-region
        className={cn(
          'flex items-center gap-2 bg-background rounded-small p-2 transition-opacity',
          showTitleBar ? 'opacity-100' : 'opacity-0',
        )}>
        <Button
          isIconOnly
          variant={resizable ? 'flat' : 'light'}
          size="sm"
          onPress={async () => {
            await currentWindow.setResizable(!resizable)
            setResizable(!resizable)
          }}>
          <MoveDiagonalIcon size={20} />
        </Button>

        <Button
          isIconOnly
          color="danger"
          variant="light"
          size="sm"
          isDisabled={resizable}
          className="ml-auto"
          onPress={async () => await currentWindow.emit('close')}>
          <XIcon size={20} />
        </Button>
      </div>

      <Outlet />
    </div>
  )
}
