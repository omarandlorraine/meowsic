import { Button } from '@heroui/react'
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

const LINKS = [
  { url: '/queue', title: 'Queue', Icon: ListVideoIcon },
  { url: '/playlists', title: 'Playlists', Icon: ListMusicIcon },
  { url: '/tracks', title: 'Tracks', Icon: MusicIcon },
  { url: '/artists', title: 'Artists', Icon: UserRoundIcon },
  { url: '/albums', title: 'Albums', Icon: Disc3Icon },
]

export function Window() {
  const currentWindow = getCurrentWindow()
  const location = useLocation()

  return (
    <>
      <div
        data-tauri-drag-region
        className="flex items-center fixed inset-x-0 top-0
        z-100 bg-default-50/25 backdrop-blur-lg pointer-events-auto">
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
        <div className="flex flex-col gap-2 p-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] h-full">
          {LINKS.map(({ url, title, Icon }) => (
            <Button
              key={url}
              as={Link}
              to={url}
              variant={location.pathname === url ? 'flat' : 'light'}
              fullWidth
              radius="sm"
              className="justify-start">
              <Icon className="text-lg" /> {title}
            </Button>
          ))}

          <Button
            as={Link}
            to="/settings"
            variant={location.pathname === '/settings' ? 'flat' : 'light'}
            fullWidth
            radius="sm"
            className="justify-start mt-auto">
            <SettingsIcon className="text-lg" /> Settings
          </Button>
        </div>

        <Outlet />
      </div>
    </>
  )
}
