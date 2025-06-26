import './styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Window } from '@/components/window'
import { HomeScreen } from '@/components/home'
import { TracksScreen } from '@/tracks/components'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Window,
    children: [
      { path: '/', Component: HomeScreen },
      { path: '/queue', Component: HomeScreen },
      { path: '/playlists', Component: HomeScreen },
      { path: '/tracks', Component: TracksScreen },
      { path: '/artists', Component: HomeScreen },
      { path: '/albums', Component: HomeScreen },
      { path: '/settings', Component: HomeScreen },
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
