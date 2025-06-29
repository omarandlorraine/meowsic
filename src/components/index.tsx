import { Button, Checkbox, Input } from '@heroui/react'
import { SearchIcon, XIcon } from 'lucide-react'
import type { UseSelection } from '@/utils'

type SearchBarProps = { value: string; onChange: (value: string) => void }

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <Input
      radius="sm"
      variant="flat"
      placeholder="Search"
      value={value}
      onValueChange={onChange}
      startContent={<SearchIcon className="text-lg flex-shrink-0 mr-1" />}
      classNames={{
        base: 'w-160 ml-auto',
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
    <div className="flex items-center gap-2" style={{ width: `calc(${data.length.toString().length}ch + 6rem)` }}>
      <Checkbox
        color="success"
        radius="full"
        isSelected={selection.values.length === data.length}
        onValueChange={() => {
          if (selection.values.length === data.length) return selection.clear()
          selection.set(data)
        }}
      />

      <Button
        size="sm"
        radius="sm"
        color="danger"
        variant="flat"
        className="!text-foreground shrink-0 font-mono"
        onPress={selection.clear}>
        {selection.values.length} <XIcon className="text-medium" />
      </Button>
    </div>
  )
}
