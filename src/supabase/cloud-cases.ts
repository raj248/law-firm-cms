import { toast } from "sonner"
import { supabase } from "./supabase"
import { PostgrestError } from "@supabase/supabase-js"

export async function pushCases(): Promise<void> {
  const unsyncedCases = await window.database.unsyncedCases()

  if (unsyncedCases.length === 0) {
    // toast.info("All Cases Already Synced")
    return
  }

  // toast.info("Sync Started", {
  //   description: `🔄 Syncing ${unsyncedCases.length} cases to Supabase...`,
  // })

  for (const kase of unsyncedCases) {
    const { error } = await supabase.from('cases').upsert({
      file_id: kase.file_id,
      case_id: kase.case_id,
      title: kase.title,
      description: kase.description,
      status: kase.status,
      client_id: kase.client_id,
      court: kase.court,
      tags: kase.tags ?? [],
      created_at: kase.created_at,
      updated_at: kase.updated_at,
    })

    if (error) {
      toast.error("Error", { description: `❌ Failed to sync ${kase.title}: ${error.message}` })
    } else {
      window.database.updateCaseSync(kase.id)
      toast.success("Synced", { description: `✅ Synced ${kase.title}` })
    }
  }

  window.debug.log('📦 Local cases marked as synced.')
}

export const deleteCase = async (id:string): Promise<{success:boolean, error?: PostgrestError}> => {

  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('file_id', id)
  if(!error) return {success:true}
  else return {success: false, error: error}
}