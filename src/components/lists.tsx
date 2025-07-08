import { useEffect, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { cn } from '@heroui/react'
import type { DraggableProvided, DraggableRubric, DraggableStateSnapshot, DropResult } from '@hello-pangea/dnd'
import type { ItemProps as VirtuosoItemProps, ContextProp as VirtuosoContextProps } from 'react-virtuoso'

type SortableVirtualListProps<T> = {
  data: T[]
  isDragDisabled?: boolean
  className?: string
  overscan?: number
  renderClone: RenderDraggableClone
  children: SortableListChildren<T>
  onDragEnd?: OnDragEnd
  getItemKey: (item: T, index: number) => string
  components: {
    List?: (props: VirtualListProps) => React.ReactNode
    Header?: (props: VirtualHeaderProps) => React.ReactNode
  }
}

export function SortableVirtualList<T>({
  data,
  children,
  onDragEnd,
  isDragDisabled,
  getItemKey,
  renderClone,
  components,
  className,
  overscan = 5,
}: SortableVirtualListProps<T>) {
  return (
    <DragDropContext onDragEnd={onDragEnd ?? (() => {})}>
      <Droppable mode="virtual" droppableId="droppable" renderClone={renderClone}>
        {provided => {
          const ref = (el: Window | HTMLElement | null) => provided.innerRef(el as HTMLElement)

          return (
            <Virtuoso
              scrollerRef={ref}
              data={data}
              overscan={overscan}
              components={{ Item: VirtualItem, ...components }}
              className={cn('size-full shrink-0', className)}
              itemContent={(index, item) => {
                if (isDragDisabled || !onDragEnd) return children(item, index)
                const key = getItemKey(item, index)

                return (
                  <Draggable key={key} index={index} draggableId={key}>
                    {(provided, snapshot) => children(item, index, { provided, snapshot })}
                  </Draggable>
                )
              }}
            />
          )
        }}
      </Droppable>
    </DragDropContext>
  )
}

type VirtualItemProps<T> = VirtuosoItemProps<T>

function VirtualItem<T>({ item, ...props }: VirtualItemProps<T>) {
  // needed to preserve height
  const [size, setSize] = useState(0)
  const knownSize = props['data-known-size']

  useEffect(() => {
    if (knownSize) setSize(knownSize)
  }, [knownSize])

  return (
    <div
      {...props}
      style={{ ...props.style, '--item-height': `${size}px` } as React.CSSProperties}
      className="empty:min-h-[var(--item-height)] empty:box-border"
    />
  )
}

export type DraggableProps = { provided: DraggableProvided; snapshot: DraggableStateSnapshot }

export type VirtualHeaderProps<T = unknown> = VirtuosoContextProps<T>

export type VirtualListProps = React.HTMLAttributes<HTMLDivElement>

export type SortableListChildren<T> = (item: T, index: number, draggableProps?: DraggableProps) => React.ReactNode

export type RenderDraggableClone = (
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  rubric: DraggableRubric,
) => React.ReactNode

export type OnDragEnd = (result: DropResult) => void
