"use client"

import { useState, useEffect } from "react"
import { UploadCloud, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import React from "react"
import { supabase } from "@/supabase/supabase"
import { toast } from "sonner"

interface DocumentItem {
  id: string
  name: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [open, setOpen] = useState(false)

  // Fetch documents from Supabase Storage
  const fetchDocuments = async () => {
    const { data, error } = await supabase.storage.from("templates").list()
    if (error) window.debug.log(error)
    if (data) {
      window.debug.log("Fetched documents: ", data)
      setDocuments(data.map((d) => ({ id: d.id, name: d.name })))
    }
  }
  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    const { data, error } = await supabase.storage.from("templates").upload(selectedFile.name, selectedFile, { upsert: true })
    if (error) {
      window.debug.log(error)
      toast.error("Upload failed")
    } else {
      window.debug.log("Upload successful: ", data)
      setDocuments((prev) => [...prev, { id: selectedFile.name, name: selectedFile.name }])
      setOpen(false)
    }
    setUploading(false)
    setSelectedFile(null)
  }

  const handleDelete = async (name: string) => {
    window.debug.log("Deleting document: ", name)
    const { data, error } = await supabase.storage.from("templates").remove([name])
    window.debug.log(data, error)
    if (error) {
      window.debug.log(error)
      toast.error("Delete failed")
    } else {
      window.debug.log("Delete successful: ", data)
      fetchDocuments()
      setDocuments((prev) => prev.filter((doc) => doc.name !== name))
    }
  }

  const handleView = async (id: string) => {
    const { data, error } = await supabase.storage.from("templates").download(id)
    if (error || !data) {
      toast.error("Download failed", { description: error.message })
      return
    }
    // Save to temp-edits and open
    const arrayBuffer = await data.arrayBuffer()

    const tempPath = await window.electronAPI.saveTempFile(id, arrayBuffer)
    window.debug.log("Temp path: ", tempPath)
    tempPath ? await window.electronAPI.openFile(tempPath) : toast.error("Can't open file")
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Document Templates</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UploadCloud className="mr-2 h-4 w-4" /> Upload</Button>
          </DialogTrigger>
          <DialogContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg"
                />
              </div>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="relative">
            <CardContent className="p-4 space-y-2">
              <p className="font-semibold truncate">{doc.name}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleView(doc.name)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.name)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
