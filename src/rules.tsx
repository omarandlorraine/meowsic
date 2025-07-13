import { useEffect, useImperativeHandle, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Input, Button, Accordion, AccordionItem } from '@heroui/react'
import { TrashIcon, PlusIcon, XIcon, CheckIcon } from 'lucide-react'
import type { Track } from '@/tracks'

type RulesEditorProps = { track: Track; data: string; ref: React.Ref<RulesEditorHandle> }

export function RulesEditor({ track, data, ref }: RulesEditorProps) {
  const [values, setValues] = useState<string[]>([])

  useEffect(() => setValues(data.split('\n')), [data])

  useImperativeHandle(ref, () => ({
    get value() {
      let data: string = ''

      for (const value of values) {
        const p = parseRule(value, track)
        if (!p) continue

        data += value
        data += '\n'
      }

      return data.trim()
    },
  }))

  return (
    <div className="flex flex-col gap-3 items-start w-120">
      {values.map((value, index) => {
        const parsed = parseRule(value, track)

        return (
          <div key={index} className="flex items-center gap-2 w-full">
            <Input
              radius="sm"
              variant="flat"
              placeholder="Provide a Rule"
              value={value}
              onValueChange={value => {
                const newValues = [...values]
                newValues[index] = value
                setValues(newValues)
              }}
              endContent={parsed ? <CheckIcon className="text-success-500" /> : <XIcon className="text-danger-500" />}
              classNames={{
                input: 'bg-transparent placeholder:text-default-300 font-mono',
                innerWrapper: 'bg-transparent',
                inputWrapper: [
                  'dark:bg-default/30',
                  'dark:hover:bg-default/40',
                  'dark:group-data-[focus=true]:bg-default/40',
                ],
              }}
            />

            <Button
              isIconOnly
              size="sm"
              radius="sm"
              color="danger"
              variant="light"
              className="text-default-500"
              onPress={() => {
                const newValues = [...values]
                newValues.splice(index, 1)
                setValues(newValues)
              }}>
              <TrashIcon className="text-lg" />
            </Button>
          </div>
        )
      })}

      <Button
        size="sm"
        radius="sm"
        variant="flat"
        onPress={() => {
          const newValues = [...values]
          newValues.push('')
          setValues(newValues)
        }}>
        <PlusIcon className="text-medium" /> Add Rule
      </Button>

      <Accordion className="mt-10" defaultExpandedKeys={['usage']}>
        <AccordionItem key="usage" title="Usage">
          <div className="text-default-500 font-mono whitespace-pre-wrap">{DESCRIPTION}</div>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export async function getRules(track: Track) {
  return await invoke<string | null>('db_get_rules', { hash: track.hash })
}

export async function setRules(track: Track, rules: string | null = '') {
  // NOTE: user is allowed to set empty rules
  return await invoke('db_set_rules', { hash: track.hash, rules })
}

function parseRule(rule: string, track: Track): Rule | null {
  const parts = rule.split(' ').filter(Boolean)
  if (parts[0] !== 'at') return null

  const trigger = parseTime(parts[1])
  if (!trigger) return null

  switch (parts[2]) {
    case 'goto': {
      if (parts[3] === 'next') return { trigger, action: 'seek', param: track.duration }

      const param = parseTime(parts[3])
      if (!param) return null

      return { trigger, action: 'seek', param }
    }

    case 'seek': {
      const param = parseInt(parts[3])
      if (isNaN(param)) return null

      return { trigger, action: 'seek', param: trigger + param }
    }

    case 'volume': {
      const param = parseInt(parts[3])
      if (isNaN(param)) return null

      return { trigger, action: 'volume', param }
    }

    default:
      return null
  }
}

export function parseRules(data: string, track: Track) {
  return data
    .split('\n')
    .map(it => parseRule(it, track))
    .filter(Boolean) as Rule[]
}

export type RulesEditorHandle = { get value(): string }

// export type Rules = { parsed: Rule[]; plain: string }

type Rule = { trigger: number; action: 'seek' | 'volume'; param: number }

const TIME_REGEX = /^(?:(\d{1,2}):)?([0-5]?\d):([0-5]?\d)$|^([0-5]?\d)$/

function parseTime(value: string) {
  if (!value) return null

  const match = value.match(TIME_REGEX)
  if (!match) return null

  const [, hh, mm, ss, solo] = match
  let hours = 0,
    minutes = 0,
    seconds = 0

  if (solo) {
    seconds = parseInt(solo, 10)
  } else {
    hours = hh ? parseInt(hh, 10) : 0
    minutes = parseInt(mm, 10)
    seconds = parseInt(ss, 10)
  }

  return hours * 3600 + minutes * 60 + seconds
}

// TODO: speed rules

const DESCRIPTION = ` 
Syntax

at hh:mm:ss goto    hh:mm:ss
at hh:mm:ss goto    next
at hh:mm:ss seek    +/-ss
at hh:mm:ss volume  n

- hh and mm are optional, ss is required
- mm and ss cannot be greater than 59

Examples

at 1:10  goto    2:10      
at 3:10  goto    next
at 8     seek   +10
at 2:08  seek   -28
at 0:40  volume  60
`
