



import { Button } from "@/components/ui/button"
import { useDocumentStore } from "@/stores/document-store"
import { Bug } from "lucide-react"
export function Debug() {
  // const docs = useDocumentStore((s)=> s.documents)
  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments)

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={async () => {
        await fetchDocuments()
        // window.debug.log(docStore.documents)
      }}
      className="rounded-full"
    >
      <Bug size={18} />
      <span className="sr-only">Debug</span>
    </Button>
  )
}