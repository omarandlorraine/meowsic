import { useState } from 'react'
import { Button, cn, Popover, PopoverContent, PopoverTrigger, Slider } from '@heroui/react'
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
  Volume2Icon,
  Volume1Icon,
  VolumeXIcon,
} from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { store, setMiniPlayerVisibility, setPlayerMaximized } from '@/settings'
import { TrackDetailsModal } from '@/tracks/components/details'
import { MiniPlayer } from '@/player/components'
import { EmotionSelect } from '@/emotions/components'
import type { LucideIcon } from 'lucide-react'

export function Window() {
  const location = useLocation()
  const currentWindow = getCurrentWindow()
  const { isPlayerMaximized, isMiniPlayerVisible, volume: globalVolume } = useStore(store)

  const [isMaximized, setIsMaximized] = useState(false)
  const [volume, setVolume] = useState(globalVolume * 100)

  const isHome = location.pathname === '/'
  const showBars = !isPlayerMaximized || !isHome

  useHotkeys(
    ['f', 'b'],
    evt => {
      switch (evt.key) {
        case 'f':
          return setPlayerMaximized(!isPlayerMaximized)
        case 'b':
          return setMiniPlayerVisibility(!isMiniPlayerVisible)
      }
    },
    [isPlayerMaximized, isMiniPlayerVisible],
  )

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
          className="text-lg px-7"
          variant={isHome ? 'flat' : 'light'}
          onPress={() => {
            if (isHome) setPlayerMaximized(!isPlayerMaximized)
          }}>
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

        <Popover placement="left" containerPadding={8} radius="sm">
          <PopoverTrigger>
            <Button isIconOnly radius="none" variant="light">
              <Volume2Icon className="text-lg text-default-500" />
            </Button>
          </PopoverTrigger>

          <PopoverContent>
            <div className="w-100 flex items-center gap-2 py-2">
              <Button
                isIconOnly
                radius="sm"
                variant="flat"
                color={globalVolume > 0 ? 'default' : 'warning'}
                onPress={() => store.setState(state => ({ volume: state.volume > 0 ? 0 : volume / 100 }))}>
                {globalVolume > 0 ? <Volume1Icon className="text-lg" /> : <VolumeXIcon className="text-lg" />}
              </Button>

              <Slider
                size="sm"
                minValue={0}
                maxValue={100}
                label="Volume"
                color="foreground"
                value={volume}
                onChangeEnd={() => store.setState({ volume: volume / 100 })}
                onChange={value => setVolume(typeof value === 'number' ? value : value[0])}
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 border-r border-default/30" />

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
            <NavLink url="/queue" title="Queue" icon={ListVideoIcon} />

            <hr className="border-default/30 mx-2" />

            <NavLink url="/albums" title="Albums" icon={Disc3Icon} />
            <NavLink url="/emotions" title="Emotions" icon={SmileIcon} />
            <NavLink url="/artists" title="Artists" icon={UserRoundIcon} />

            <NavLink url="/settings" title="Settings" icon={SettingsIcon} className="mt-auto" />
          </div>
        )}

        <Outlet />
      </div>

      {isMiniPlayerVisible && !isHome && <MiniPlayer />}

      <TrackDetailsModal />
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
