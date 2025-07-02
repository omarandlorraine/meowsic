import { Button, cn } from '@heroui/react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  Disc3Icon,
  ListMusicIcon,
  ListVideoIcon,
  MinusIcon,
  MusicIcon,
  PlayIcon,
  SettingsIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { LucideIcon } from 'lucide-react'

export function Window() {
  const currentWindow = getCurrentWindow()

  return (
    <>
      <div
        data-tauri-drag-region
        className="flex items-center pointer-events-auto 
        fixed inset-x-0 top-0 z-100 bg-default-50/25 backdrop-blur-lg backdrop-saturate-125">
        <Button as={Link} to="/" variant="light" radius="none" className="text-lg px-6">
          <PlayIcon className="text-lg text-secondary-600" /> Meowsic
        </Button>

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
        <div className="flex flex-col gap-2 p-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] h-full w-44">
          <NavLink url="/queue" title="Queue" icon={ListVideoIcon} />
          <NavLink url="/playlists" title="Playlists" icon={ListMusicIcon} />

          <hr className="border-default/30 mx-2" />

          <NavLink url="/tracks" title="Tracks" icon={MusicIcon} />
          <NavLink url="/albums" title="Albums" icon={Disc3Icon} />
          <NavLink url="/artists" title="Artists" icon={UserRoundIcon} />

          <NavLink url="/settings" title="Settings" icon={SettingsIcon} className="mt-auto" />
        </div>

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
