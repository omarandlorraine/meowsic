import { useEffect, useState } from 'react'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { load as loadStore } from '@tauri-apps/plugin-store'
import type { EmblaCarouselType as Carousel } from 'embla-carousel'

export type Medium = { id: string; type: 'image' | 'video'; url: string }

export type Widget = {
  width: number
  height: number
  x: number
  y: number
  // id: string
} & { type: 'gallery'; media: Medium[] }

export const widgetStore = await loadStore('widget-store.json', { autoSave: false })

export async function spawnWidgetWindows() {
  const entries = await widgetStore.entries<Widget>()
  const windows: WebviewWindow[] = []

  for (const [type, data] of entries) {
    // NOTE: currently only one of each type of widget is supported
    // eg. only one gallery widget -> widget-gallery -> /widgets/gallery
    const title = `mirage ${type} widget`
    const url = `/widgets/${type}`

    const window = new WebviewWindow(`widget-${type}`, {
      title,
      url,
      height: data.height,
      width: data.width,
      x: data.x,
      y: data.y,
      shadow: false,
      focus: false,
      visible: false,
      resizable: false,
      transparent: true,
      decorations: false,
      // skipTaskbar: true,
      // alwaysOnBottom: true,
    })

    window.once('tauri://created', async () => {
      // for some reason the config doesn't work
      // await window.setAlwaysOnBottom(true)
      await window.show()
    })

    window.once('tauri://error', err => {
      console.error(err)
    })

    windows.push(window)
  }

  return windows
}

export function createGalleryWidget(media: Medium[] = []): Widget {
  return { type: 'gallery', width: 500, height: 500, x: 0, y: 0, media }
}

// tauri `convertFileSrc` won't work
export function getAssetUrl(path: string) {
  return `http://asset.localhost/${path}`
}

export function useCarouselDots(api?: Carousel) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onClick = (index: number) => {
    api?.scrollTo(index)
  }

  const onInit = (api: Carousel) => {
    setScrollSnaps(api.scrollSnapList())
  }

  const onSelect = (api: Carousel) => {
    setSelectedIndex(api.selectedScrollSnap())
  }

  useEffect(() => {
    if (!api) return

    onInit(api)
    onSelect(api)

    api.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect)
  }, [api, onInit, onSelect])

  return { selectedIndex, scrollSnaps, onClick }
}
