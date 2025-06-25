import { Card, CardFooter, Image } from '@heroui/react'
import { Link } from 'react-router'

export function HomeScreen() {
  return (
    <div className="p-6 flex gap-6 self-start">
      <Card isPressable isFooterBlurred radius="sm" className="border-none" as={Link} to="/genshin">
        <Image radius="sm" height={240} className="object-cover" src="/genshin/thumbnail.jpg" />

        <CardFooter
          className="justify-between overflow-hidden py-1 px-3 absolute bottom-1 right-1
          bg-background/40 rounded-small w-auto shadow-small z-10 text-small">
          Genshin Impact
        </CardFooter>
      </Card>
    </div>
  )
}
