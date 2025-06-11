"use client"

import { useState } from "react"
import { UploadCloud, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import React from "react"
import { shell } from "electron"

interface DocumentItem {
  id: string
  name: string
  caseId: string
  url: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [caseId, setCaseId] = useState("")
  const [open, setOpen] = React.useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!selectedFile || !caseId) return
    setUploading(true)

    // Simulated upload
    setTimeout(() => {
      setDocuments((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2),
          name: selectedFile.name,
          caseId,
          url: URL.createObjectURL(selectedFile),
        },
      ])
      setSelectedFile(null)
      setCaseId("")
      setUploading(false)
      setOpen(false)
    }, 1000)
  }

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Documents</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UploadCloud className="mr-2 h-4 w-4" /> Upload</Button>
          </DialogTrigger>
          <DialogContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="caseId">Case ID</Label>
                <Input
                  id="caseId"
                  placeholder="Enter Case ID"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg"
                />
              </div>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !caseId}>
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
              <p className="text-sm text-muted-foreground">Case ID: {doc.caseId}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.electronAPI.openFile(doc.url)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
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
