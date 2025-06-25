import { Button, Divider, Image, ScrollShadow, Spinner, Card, CardFooter } from '@heroui/react'
import { Link, useParams } from 'react-router'
import { DownloadIcon, MoveRight, StarIcon } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { widgetStore, getAssetUrl, createGalleryWidget } from '@/utils'
import { characterId, getCharacterList, getLocalCharacter, saveCharacter } from '@/genshin'
import type { Medium, Widget } from '@/utils'

export function GenshinScreen() {
  return (
    <div className="p-6 flex flex-col gap-3 self-start items-start">
      <Button color="primary" variant="light" size="lg" as={Link} to="/genshin/characters">
        Characters <MoveRight />
      </Button>
    </div>
  )
}

export function GenshinCharactersScreen() {
  const queryCharacterList = useQuery({ queryKey: ['genshin-character-list'], queryFn: getCharacterList })

  return (
    <ScrollShadow hideScrollBar className="size-full">
      {queryCharacterList.isPending && (
        <div className="size-full grid place-items-center">
          <Spinner variant="dots" size="lg" />
        </div>
      )}

      {queryCharacterList.isSuccess && (
        <div className="p-6 grid grid-cols-3 gap-6">
          {Object.entries(queryCharacterList.data).map(([_id, item]) => {
            return (
              <Card
                as={Link}
                radius="sm"
                shadow="sm"
                isPressable
                key={item.name}
                to={`/genshin/characters/${item.name}`}
                className="dark:bg-secondary-700/10 p-6 pt-10 flex flex-col gap-4 items-center">
                <Image
                  radius="sm"
                  height={140}
                  src={item.icon}
                  className="object-contain bg-secondary-500/20 border-secondary-700 border"
                />

                <div className="text-large text-secondary-500">{item.name}</div>
              </Card>
            )
          })}
        </div>
      )}
    </ScrollShadow>
  )
}

export function GenshinCharacterScreen() {
  const { name } = useParams<{ name: string }>()

  const queryCharacter = useQuery({
    queryKey: ['genshin-local-character', name],
    queryFn: async () => {
      if (!name) throw new Error('name is required')
      return { ...(await getLocalCharacter(name)), id: await characterId(name) }
    },
  })

  const mutationSaveCharacter = useMutation({
    mutationKey: ['genshin-save-character', name],
    mutationFn: async () => {
      if (!name) throw new Error('name is required')
      return await saveCharacter(name)
    },
    onSuccess: () => {
      queryCharacter.refetch()
    },
  })

  const queryGalleryWidget = useQuery({
    queryKey: ['widget-gallery'],
    queryFn: async () => await widgetStore.get<Widget>('gallery'),
  })

  const mutationModifyGalleryWidget = useMutation({
    mutationFn: async (medium: Medium) => {
      const entry = await widgetStore.get<Widget>('gallery')

      if (!entry) await widgetStore.set('gallery', createGalleryWidget([medium]))
      else {
        if (entry.type !== 'gallery') throw new Error('widget type is not gallery')
        await widgetStore.set('gallery', { ...entry, media: [...entry.media, medium] } satisfies Widget)
      }

      await widgetStore.save()
      console.log(await widgetStore.entries<Widget>())
    },
    onSuccess: () => {
      queryGalleryWidget.refetch()
    },
  })

  return (
    <ScrollShadow hideScrollBar className="size-full">
      {queryCharacter.isPending && (
        <div className="size-full grid place-items-center">
          <Spinner variant="dots" size="lg" />
        </div>
      )}

      <div className="p-6 flex flex-col gap-6">
        <div className="flex gap-6 h-50">
          {queryCharacter.isSuccess && (
            <>
              <Image
                radius="sm"
                src={getAssetUrl(queryCharacter.data.localMedia.icon)}
                className="object-contain bg-secondary-500/20 border-secondary-700 border h-full"
              />

              <div className="flex flex-col gap-3 h-full">
                <div className="text-4xl text-secondary-200">{queryCharacter.data.name}</div>

                <div className="flex gap-1.5 items-center text-secondary-500 mb-auto">
                  {Array.from({ length: queryCharacter.data.quality }, (_, i) => (
                    <StarIcon key={i} size={18} />
                  ))}
                </div>

                <Image height={64} width={64} src={`/genshin/elements/gilded/${queryCharacter.data.element}.png`} />
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 h-full ml-auto items-end">
            <Button
              size="lg"
              isDisabled={queryCharacter.isSuccess}
              color={queryCharacter.isSuccess ? 'danger' : 'primary'}
              variant={queryCharacter.isSuccess ? 'flat' : 'light'}
              isLoading={mutationSaveCharacter.isPending}
              onPress={() => mutationSaveCharacter.mutate()}>
              {queryCharacter.isSuccess ? 'Saved' : 'Save'} <DownloadIcon size={20} />
            </Button>

            {queryCharacter.isSuccess && (
              <div className="text-tiny text-end text-default-400 mt-auto">
                Delete {queryCharacter.data.id} <br /> directory manually to save again
              </div>
            )}
          </div>
        </div>

        {queryCharacter.isSuccess && (
          <>
            <Divider />

            <div className="grid grid-cols-3 gap-6">
              {[...queryCharacter.data.localMedia.cards, ...queryCharacter.data.localMedia.splashes].map((item, i) => {
                const id = `${queryCharacter.data.id}-${i}`
                const url = getAssetUrl(item)

                const isAdded = queryGalleryWidget.data?.media.some(m => m.id === id)
                const isModifying =
                  mutationModifyGalleryWidget.isPending && mutationModifyGalleryWidget.variables.id === id

                return (
                  <Card key={item} isFooterBlurred shadow="sm" radius="sm" className="bg-transparent">
                    <Image
                      src={url}
                      width="100%"
                      height="30rem"
                      radius="sm"
                      className="object-contain bg-background/20"
                    />

                    <CardFooter
                      className="justify-between overflow-hidden p-1 absolute bottom-1 right-1
                      bg-background/20 rounded-small w-auto shadow-small z-10 text-small">
                      <Button
                        size="sm"
                        variant="light"
                        isDisabled={isAdded}
                        isLoading={isModifying}
                        onPress={() => mutationModifyGalleryWidget.mutate({ id, type: 'image', url })}>
                        {isAdded ? 'Added' : 'Add'} to Widget
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </ScrollShadow>
  )
}
