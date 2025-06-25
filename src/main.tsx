import './styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { defaultWindowIcon } from '@tauri-apps/api/app'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu } from '@tauri-apps/api/menu'
import { spawnWidgetWindows } from '@/utils'
import { Window, WidgetWindow } from '@/components/windows'
import { HomeScreen } from '@/components/home'
import { GalleryWidget } from '@/components/widgets'
import { GenshinScreen, GenshinCharactersScreen, GenshinCharacterScreen } from '@/genshin/components'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Window,
    children: [
      { path: '/', Component: HomeScreen },
      { path: '/genshin', Component: GenshinScreen },
      { path: '/genshin/characters', Component: GenshinCharactersScreen },
      { path: '/genshin/characters/:name', Component: GenshinCharacterScreen },
    ],
  },
  {
    path: '/widgets',
    Component: WidgetWindow,
    children: [{ path: 'gallery', Component: GalleryWidget }],
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

if (window.location.pathname.startsWith('/widgets')) {
  window.document.body.classList.add('widget')
} else {
  let windows = await spawnWidgetWindows()
  const currentWindow = getCurrentWindow()

  currentWindow.onCloseRequested(async () => {
    for (const window of windows) await window.close()
  })

  const show = async () => await currentWindow.show()
  const close = async () => await currentWindow.close()

  const showWidgets = async () => {
    windows = await spawnWidgetWindows()
  }

  await TrayIcon.new({
    title: 'mirage',
    icon: (await defaultWindowIcon())!,
    menuOnLeftClick: false,
    menu: await Menu.new({
      items: [
        { id: 'open', text: 'Open', action: show },
        { id: 'show-widgets', text: 'Show Widgets', action: showWidgets },
        { id: 'close', text: 'Close', action: close },
      ],
    }),
    action: async evt => {
      switch (evt.type) {
        case 'DoubleClick':
          await show()
          break
      }
    },
  })
}
