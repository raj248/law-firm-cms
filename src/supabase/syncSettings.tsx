import { supabase } from '@/supabase/supabase'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settings-store'
import { Court, Tag } from '@/types';
import { playSound } from '@/utils/sound';

export async function pullAllSettings(): Promise<void> {
  try {
    const [courtsRes, tagsRes] = await Promise.all([
      supabase.from('courts').select('*'),
      supabase.from('tags').select('*'),
    ])

    if (courtsRes.error) {
      toast.error('❌ Courts Pull Failed', { description: courtsRes.error.message })
      playSound('error')
    } else if (courtsRes.data) {
      const courts = courtsRes.data as Court[]
      for (const court of courts) window.database.insertCourt(court.name, court.id, 1)
      useSettingsStore.getState().fetchCourts()
      // toast.success(`✅ Pulled ${courts.length} court(s)`)
    }

    if (tagsRes.error) {
      toast.error('❌ Tags Pull Failed', { description: tagsRes.error.message })
      playSound('error')
    } else if (tagsRes.data) {
      const tags = tagsRes.data as Tag[]
      for (const tag of tags) window.database.insertTag(tag.name, tag.id, 1)
      useSettingsStore.getState().fetchTags()
      // toast.success(`✅ Pulled ${tags.length} tag(s)`)
    }

  } catch (err: any) {
    toast.error('❌ Sync Settings Error', { description: err.message || "Unknown error" })
    playSound('error')
  }
}

export function handleSettingsRealtimePayload(payload: any) {
  const { eventType, new: newRow, old: oldRow, table } = payload

  if (table !== "courts" && table !== "tags") return

  const store = useSettingsStore.getState()

  const isCourt = table === "courts"
  const name = (eventType === "DELETE" ? oldRow.name : newRow.name) as string

  if (eventType === "INSERT" || eventType === "UPDATE") {
    const updateFn = isCourt ? store.setCourts : store.setTags
    const current = isCourt ? store.courts : store.tags
    const updated = current.includes(name) ? current : [...current, name]

    isCourt ? window.database.insertCourt(name, newRow.id, 1) : window.database.insertTag(name, newRow.id, 1)
    updateFn(updated)
  }

  if (eventType === "DELETE") {
    // const updateFn = isCourt ? store.setCourts : store.setTags
    // const current = isCourt ? store.courts : store.tags
    // const filtered = current.filter((item) => item !== name)
    window.debug.log("Delete Event Unhandled for Courts/Tags")
    // isCourt? window.database.deleteSetting(table, name)
    // updateFn(filtered)
  }

  window.debug.log(
    `🛠 Handled ${eventType} for ${table}:`,
    name
  )
}
