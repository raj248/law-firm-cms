import { supabase } from '@/supabase/supabase'
import { Court, Tag } from '@/types'
import { toast } from 'sonner'

export async function pushSettings(): Promise<void> {
  const [unsyncedCourts, unsyncedTags] = await Promise.all([
    window.database.unsyncedCourts() as Promise<Court[]>,
    window.database.unsyncedTags() as Promise<Tag[]>,
  ])

  const totalCourts = unsyncedCourts.length
  const totalTags = unsyncedTags.length

  if (totalCourts === 0 && totalTags === 0) {
    // toast.info("✅ Settings already synced")
    return
  }

  if (totalCourts > 0) {
    for (const court of unsyncedCourts) {
      const { error } = await supabase.from('courts').upsert({
        id: court.id,
        name: court.name,
        created_at: court.created_at,
      })
      if (error) {
        toast.error("❌ Court Sync Failed", { description: error.message })
      } else {
        window.database.updateCourtSync(court.name)
        // toast.success("✅ Court Synced", { description: court.name })
      }
    }
  }

  if (totalTags > 0) {
    for (const tag of unsyncedTags) {
      const { error } = await supabase.from('tags').upsert({
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at,
      })
      if (error) {
        toast.error("❌ Tag Sync Failed", { description: error.message })
      } else {
        window.database.updateTagSync(tag.name)
        // toast.success("✅ Tag Synced", { description: tag.name })
      }
    }
  }

  // window.debug.log(`✅ Pushed ${totalCourts} courts and ${totalTags} tags`)
}
