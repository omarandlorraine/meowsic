import { invoke } from '@tauri-apps/api/core'

type CharacterEntry = { name: string; icon: string }
type CharacterList = Record<string, CharacterEntry>

export type Media = { icon: string; cards: string[]; splashes: string[] }

type Element = 'Pyro' | 'Hydro' | 'Cryo' | 'Electro' | 'Anemo' | 'Geo' | 'Dendro'

export type Character = {
  name: string
  element: Element
  quality: 4 | 5
  ascensionMaterials: string[]
  talentUpgradeMaterials: string[]
  outfits: string[]
  media: Media
  localMedia: Media
}

export async function getCharacterList() {
  return await invoke<CharacterList>('genshin_get_character_list')
}

export async function getLocalCharacter(name: string): Promise<Character> {
  const [character, localMedia] = await invoke<[Character, Media]>('genshin_get_local_character', { name })
  return { ...character, localMedia }
}

export async function characterId(data: string | CharacterEntry) {
  const name = typeof data === 'string' ? data : data.name
  return await invoke<string>('genshin_character_id', { name })
}

export async function saveCharacter(name: string) {
  return await invoke('genshin_save_character', { name })
}
