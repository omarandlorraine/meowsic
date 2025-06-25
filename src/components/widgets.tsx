import { useEffect, useState } from 'react'
import { Button, cn, Divider, Form, Image, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import { useParams } from 'react-router'
import { EllipsisIcon, XIcon } from 'lucide-react'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { useQuery } from '@tanstack/react-query'
import useCarousel from 'embla-carousel-react'
import { widgetStore, getAssetUrl, useCarouselDots } from '@/utils'
import { FastAverageColor } from 'fast-average-color'
import type { Medium, Widget } from '@/utils'

export function GalleryWidget() {
  const currentWindow = getCurrentWindow()

  const query = useQuery({
    queryKey: ['widget-gallery'],
    queryFn: async () => await widgetStore.get<Widget>('gallery'),
  })

  useEffect(() => {
    const unlisten = currentWindow.listen('close', async () => {
      const { width, height } = await currentWindow.outerSize()
      const { x, y } = await currentWindow.outerPosition()

      await widgetStore.set('gallery', { ...query.data, x, y, width, height })
      await widgetStore.save()
      await currentWindow.close()
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [query.data])

  const [carouselRef, carousel] = useCarousel({ loop: true })
  const carouselDots = useCarouselDots(carousel)

  const [bgGradient, setBgGradient] = useState('')

  useEffect(() => {
    ;(async () => {
      if (!carousel || !query.data) return
      const media = query.data.media

      async function getDominantColorGradient(medium: Medium) {
        const imgEl = document.getElementById(medium.id) as HTMLImageElement
        const color = await parseDominantColor(imgEl)

        return `linear-gradient(to top, ${color.hexa} 0%, ${color.hex}00 100%)`
      }

      setBgGradient(await getDominantColorGradient(media[0]))

      carousel.on('select', async () => {
        const medium = media[carousel.selectedScrollSnap()]
        console.log(carousel.selectedScrollSnap())
        setBgGradient(await getDominantColorGradient(medium))
      })
    })()
  }, [carousel, query.data])

  return (
    <div className="size-full flex flex-col overflow-hidden relative group">
      <div
        className="absolute inset-0 -z-10 group-hover:opacity-100 opacity-0 transition-opacity rounded-small"
        style={{ background: bgGradient }}
      />

      {query.isSuccess && query.data && (
        <>
          {query.data.type === 'gallery' && (
            <div ref={carouselRef} className="overflow-hidden flex size-full">
              <div className="flex size-full">
                {query.data.media.map(it => (
                  <div className="min-w-0 size-full flex justify-center flex-[0_0_100%]" key={it.id}>
                    <Image
                      id={it.id}
                      src={it.url}
                      width="100%"
                      height="100%"
                      radius="none"
                      className="object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="absolute bottom-1 inset-x-1 group-hover:opacity-100 opacity-0 transition-opacity">
            <div className="flex items-center gap-4 p-1 bg-background/70 backdrop-blur-lg rounded-small">
              <Button
                size="sm"
                color="danger"
                variant="flat"
                // className="ml-auto"
                onPress={async () => {
                  // await widgetStore.save()
                }}>
                Remove
              </Button>

              <div className="flex items-center gap-2 shrink-0">
                {carouselDots.scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselDots.onClick(index)}
                    className={cn(
                      'rounded-full size-2 bg-default-300',
                      index === carouselDots.selectedIndex && 'bg-primary-500',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const fac = new FastAverageColor()

async function parseDominantColor(imgEl: HTMLImageElement) {
  return await fac.getColorAsync(imgEl, { crossOrigin: 'anonymous' })
}
