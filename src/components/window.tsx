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
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { setPlayerMaximized, store } from '@/utils'
import type { LucideIcon } from 'lucide-react'

export function Window() {
  const location = useLocation()
  const currentWindow = getCurrentWindow()
  const isPlayerMaximized = useStore(store, state => state.isPlayerMaximized)
  const showBars = !isPlayerMaximized || location.pathname !== '/'

  return (
    <>
      <div
        data-tauri-drag-region
        className={cn(
          'flex items-center pointer-events-auto fixed inset-x-0 top-0 z-100 bg-default-50/25 backdrop-blur-lg backdrop-saturate-125',
          !showBars && 'opacity-0 hover:opacity-100 transition-opacity',
        )}>
        <Button
          as={Link}
          to="/"
          radius="none"
          className="text-lg px-6"
          variant={location.pathname === '/' ? 'flat' : 'light'}>
          <PawPrintIcon className="text-lg text-secondary-600" /> Meowsic
        </Button>

        {location.pathname === '/' && (
          <Button
            isIconOnly
            radius="none"
            variant={isPlayerMaximized ? 'flat' : 'light'}
            color={isPlayerMaximized ? 'secondary' : 'default'}
            onPress={() => setPlayerMaximized(!isPlayerMaximized)}>
            <MaximizeIcon className={cn('text-lg', !isPlayerMaximized && 'text-default-500')} />
          </Button>
        )}

        <Button variant="light" radius="none" className="ml-auto min-w-12" onPress={() => currentWindow.minimize()}>
          <MinusIcon className="text-lg text-default-500" />
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

            <hr className="border-default/30 mx-2" />

            <NavLink url="/queue" title="Queue" icon={ListVideoIcon} />
            <NavLink url="/albums" title="Albums" icon={Disc3Icon} />
            <NavLink url="/artists" title="Artists" icon={UserRoundIcon} />

            <NavLink url="/settings" title="Settings" icon={SettingsIcon} className="mt-auto" />
          </div>
        )}

        <Outlet />
      </div>
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
