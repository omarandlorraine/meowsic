import { Button } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { FileScanIcon, PlusIcon, XIcon } from 'lucide-react'

export function SettingsScreen() {
  const queryDirs = useQuery({
    queryKey: ['dirs'],
    queryFn: getDirs,
  })

  return (
    <div
      className="p-3 pt-[calc(theme(spacing.10)+theme(spacing.3))] 
      overflow-auto w-full flex flex-col items-start gap-3">
      <div className="text-large my-2">Folders to Scan</div>

      {queryDirs.isSuccess && queryDirs.data.length > 0 && (
        <div className="flex flex-col gap-3 p-3 bg-default-50/25 rounded-small">
          {queryDirs.data.map(dir => (
            <div key={dir} className="flex items-center w-100 pl-2">
              <div className="text-default-500 font-mono">{dir}</div>

              <Button
                isIconOnly
                size="sm"
                radius="full"
                color="danger"
                variant="light"
                className="ml-auto shrink-0"
                onPress={async () => {
                  await setDirs(queryDirs.data.filter(d => d !== dir))
                  await queryDirs.refetch()
                }}>
                <XIcon className="text-medium !text-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="flat"
        radius="sm"
        onPress={async () => {
          const selected = await open({ directory: true })
          if (selected) await setDirs([...(queryDirs.data ?? []), selected])
          await queryDirs.refetch()
        }}>
        <PlusIcon className="text-lg" /> Add Folder
      </Button>

      <Button variant="flat" radius="sm" onPress={async () => await scanDirs()}>
        <FileScanIcon className="text-lg" /> Scan
      </Button>
    </div>
  )
}

async function scanDirs() {
  return await invoke('db_scan_dirs')
}

async function setDirs(dirs: string[]) {
  return await invoke('db_set_dirs', { dirs })
}

async function getDirs() {
  return await invoke<string[]>('db_get_dirs')
}
