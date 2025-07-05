import { useState } from 'react'
import { Button, cn } from '@heroui/react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Link, Outlet, useLocation } from 'react-router'
import { useStore } from 'zustand'
import {
  Disc3Icon,
  ListMusicIcon,
  ListVideoIcon,
  MaximizeIcon,
  MinusIcon,
  MusicIcon,
  PawPrintIcon,
  SettingsIcon,
  XIcon,
  SmileIcon,
  UserRoundIcon,
  PictureInPicture2Icon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
} from 'lucide-react'
import { setMiniPlayerVisibility, setPlayerMaximized, store } from '@/utils'
import { MiniPlayer } from '@/player/components'
import { EmotionSelect } from '@/emotions/components'
import type { LucideIcon } from 'lucide-react'

export function Window() {
  const location = useLocation()
  const currentWindow = getCurrentWindow()
  const { isPlayerMaximized, isMiniPlayerVisible } = useStore(store)
  const [isMaximized, setIsMaximized] = useState(false)

  const isHome = location.pathname === '/'
  const showBars = !isPlayerMaximized || !isHome

  return (
    <>
      <div
        data-tauri-drag-region
        className={cn(
          'flex items-center pointer-events-auto fixed inset-x-0 top-0 z-100 bg-default-50/25 backdrop-blur-lg backdrop-saturate-125',
          !showBars && 'opacity-0 hover:opacity-100 transition-opacity',
        )}>
        <Button as={Link} to="/" radius="none" className="text-lg px-6" variant={isHome ? 'flat' : 'light'}>
          <PawPrintIcon className="text-lg text-secondary-600" /> Meowsic
        </Button>

        <EmotionSelect className="ml-auto" />

        <Button
          isIconOnly
          radius="none"
          variant={isMiniPlayerVisible ? 'flat' : 'light'}
          color={isMiniPlayerVisible ? 'secondary' : 'default'}
          onPress={() => setMiniPlayerVisibility(!isMiniPlayerVisible)}>
          <PictureInPicture2Icon className={cn('text-lg', !isMiniPlayerVisible && 'text-default-500')} />
        </Button>

        <Button
          isIconOnly
          radius="none"
          variant={isPlayerMaximized ? 'flat' : 'light'}
          color={isPlayerMaximized ? 'secondary' : 'default'}
          onPress={() => setPlayerMaximized(!isPlayerMaximized)}>
          <MaximizeIcon className={cn('text-lg', !isPlayerMaximized && 'text-default-500')} />
        </Button>

        <Button variant="light" radius="none" className="min-w-12" onPress={() => currentWindow.minimize()}>
          <MinusIcon className="text-lg text-default-500" />
        </Button>

        <Button
          variant="light"
          radius="none"
          className="min-w-12 text-default-500 text-lg"
          onPress={() => {
            currentWindow.toggleMaximize()
            setIsMaximized(!isMaximized)
          }}>
          {isMaximized ? <ChevronsDownUpIcon className="rotate-45" /> : <ChevronsUpDownIcon className="rotate-45" />}
        </Button>

        <Button
          isIconOnly
          color="danger"
          variant="light"
          radius="none"
          className="min-w-12"
          onPress={() => currentWindow.close()}>
          <XIcon className="text-lg text-default-500" />
        </Button>
      </div>

      <div className="flex h-full">
        {showBars && (
          <div className="flex flex-col gap-2 p-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] h-full w-44">
            <NavLink url="/tracks" title="Tracks" icon={MusicIcon} />
            <NavLink url="/playlists" title="Playlists" icon={ListMusicIcon} />
            <NavLink url="/emotions" title="Emotions" icon={SmileIcon} />

            <hr className="border-default/30 mx-2" />

            <NavLink url="/queue" title="Queue" icon={ListVideoIcon} />
            <NavLink url="/albums" title="Albums" icon={Disc3Icon} />
            <NavLink url="/artists" title="Artists" icon={UserRoundIcon} />

            <NavLink url="/settings" title="Settings" icon={SettingsIcon} className="mt-auto" />
          </div>
        )}

        <Outlet />
      </div>

      {isMiniPlayerVisible && !isHome && <MiniPlayer />}
    </>
  )
}

type NavLinkProps = { url: string; title: string; icon: LucideIcon | (() => React.ReactNode); className?: string }

function NavLink({ url, title, icon: Icon, className }: NavLinkProps) {
  const location = useLocation()

  return (
    <Button
      as={Link}
      to={url}
      variant={location.pathname.startsWith(url) ? 'flat' : 'light'}
      fullWidth
      radius="sm"
      className={cn('justify-start', className)}>
      <Icon className="text-lg" /> {title}
    </Button>
  )
}
