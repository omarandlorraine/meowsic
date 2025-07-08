import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Card, CardFooter } from '@heroui/react'
import { Disc3Icon } from 'lucide-react'
import { getAlbums } from '@/tracks'
import { Cover } from '@/tracks/components/details'

export function AlbumsScreen() {
  const query = useQuery({ queryKey: ['albums'], queryFn: getAlbums })

  return (
    <div className="pt-[calc(theme(spacing.10))] overflow-auto w-full flex flex-col h-full gap-2">
      <div className="grid grid-cols-8 p-3 shrink-0 w-full gap-0.5">
        {query.isSuccess &&
          query.data.map(item => (
            <Card
              as={Link}
              key={item.name}
              radius="none"
              shadow="none"
              isFooterBlurred
              to={`/tracks?album=${item.name}`}
              className="aspect-square bg-transparent group">
              <Cover className="size-full rounded-none" url={item.cover} placeholder={Disc3Icon} />

              <CardFooter
                className="absolute bg-background/60 bottom-0 z-10 py-2 px-3
                max-h-10 group-hover:max-h-full transition-[max-height]">
                <div className="text-small line-clamp-1 group-hover:line-clamp-none">{item.name}</div>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  )
}
