import './styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { applyTheme } from '@/utils'
import { init as initPlayer, onGlobalShortcut as onPlayerGlobalShortcut } from '@/player'
import { Window } from '@/components/window'
import { HomeScreen } from '@/components/home'
import { TracksScreen } from '@/tracks/components'
import { PlaylistsScreen, PlaylistScreen } from '@/playlists/components'
import { EmotionsScreen, EmotionScreen } from '@/emotions/components'
import { QueueScreen } from '@/queue'
import { AlbumsScreen } from '@/albums'
import { ArtistsScreen } from '@/artists'
import { SettingsScreen } from '@/settings'
import { register } from '@tauri-apps/plugin-global-shortcut'

const currentWindow = getCurrentWindow()

const router = createBrowserRouter([
  {
    path: '/',
    Component: Window,
    children: [
      { path: '/', Component: HomeScreen },
      { path: '/queue', Component: QueueScreen },
      { path: '/tracks', Component: TracksScreen },
      { path: '/playlists', Component: PlaylistsScreen },
      { path: '/playlists/:name', Component: PlaylistScreen },
      { path: '/emotions', Component: EmotionsScreen },
      { path: '/emotions/:name', Component: EmotionScreen },
      { path: '/albums', Component: AlbumsScreen },
      { path: '/artists', Component: ArtistsScreen },
      { path: '/settings', Component: SettingsScreen },
    ],
  },
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 2 * 60 * 1000, refetchOnMount: 'always' },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)

applyTheme()
await initPlayer()

try {
  await currentWindow.show()
  await currentWindow.setFocus()
} catch (err) {
  await currentWindow.close()
}

document.addEventListener('contextmenu', evt => evt.preventDefault())
await register(['MediaTrackNext', 'MediaTrackPrevious', 'MediaPlayPause', 'MediaStop'], onPlayerGlobalShortcut)
