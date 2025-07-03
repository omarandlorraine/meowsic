import { Checkbox, Chip, Input } from '@heroui/react'
import { SearchIcon } from 'lucide-react'
import type { UseSelection } from '@/utils'

type SearchBarProps = { value: string; onChange: (value: string) => void; className?: string }

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <Input
      radius="sm"
      variant="flat"
      placeholder="Search"
      value={value}
      onValueChange={onChange}
      onClear={() => onChange('')}
      startContent={<SearchIcon className="text-lg text-default-500 flex-shrink-0 mr-1" />}
      classNames={{
        base: className,
        input: 'bg-transparent placeholder:text-default-300',
        innerWrapper: 'bg-transparent',
        inputWrapper: ['dark:bg-default/30', 'dark:hover:bg-default/40', 'dark:group-data-[focus=true]:bg-default/40'],
      }}
    />
  )
}

type SelectAllControlsProps<T> = { data: T[]; selection: UseSelection<T> }

export function SelectAllControls<T>({ selection, data }: SelectAllControlsProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        color="success"
        radius="full"
        isSelected={selection.values.length === data.length}
        onValueChange={() => {
          if (selection.values.length === data.length) return selection.clear()
          selection.set(data)
        }}
      />

      <Chip
        variant="flat"
        color="danger"
        onClose={selection.clear}
        classNames={{ base: '!text-foreground shrink-0 font-mono', closeButton: 'mx-0.5' }}>
        {selection.values.length}
      </Chip>
    </div>
  )
}
