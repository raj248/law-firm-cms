"use client"

import { useState, useEffect, useMemo } from "react"
import { FilePlus2, Trash2, FileText, FileImage, FileArchive, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { Label } from "@/components/ui/label"
import React from "react"
import { supabase } from "@/supabase/supabase"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentStore } from "@/stores/document-store"

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<{ name: string } | null>(null);

  const documents = useDocumentStore((s) => s.documents)

  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments);
  const { removeDocument, handleView } = useDocumentStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      window.debug.log("Documents loading...");
      await fetchDocuments();
      window.debug.log("Documents loaded");
      setLoading(false);
    };
    load();
  }, []);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    const { data, error } = await supabase.storage.from("templates").upload(selectedFile.name, selectedFile, { upsert: true })
    if (error) {
      window.debug.log(error)
      toast.error("Upload failed")
    } else {
      toast.success("Upload successful")
      fetchDocuments()
      window.debug.log(data)
      setOpen(false)
    }
    setUploading(false)
    setSelectedFile(null)
  }

  const handleDelete = async (name: string) => {
    setConfirmDelete({ name });
    // if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    // const { error } = await supabase.storage.from("templates").remove([name])
    // if (error) {
    //   window.debug.log(error)
    //   toast.error("Delete failed")
    // } else {
    //   toast.success("Deleted successfully")
    //   fetchDocuments()
    //   removeDocument(name)
    // }
  }

  const filteredDocuments = useMemo(() =>
    documents
      .filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [documents, search]);


  const renderFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return <FileImage className="w-12 h-12 text-muted-foreground" />
    if (mimetype === "application/pdf") return <FileArchive className="w-12 h-12 text-muted-foreground" />
    return <FileText className="w-12 h-12 text-muted-foreground" />
  }

  return (
    <div className="p-4 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold">Document Templates</h2>
        <div className="flex gap-2">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />

          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><FilePlus2 className="mr-2 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <div className="space-y-4">
                <Label htmlFor="file">Select File</Label>
                <Input id="file" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg" />
                <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-4`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
          <p className="text-muted-foreground">No templates found.</p>
          <Button onClick={() => setOpen(true)}>Upload Your First Template</Button>
        </div>
      ) : (
        <div className={`grid ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-4`}>
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className={`relative cursor-pointer group hover:bg-accent transition ${viewMode === "list" ? "flex items-center p-2" : ""}`}
              onClick={() => handleView(doc)}
            >
              {viewMode === "grid" ? (
                <CardContent className="p-2 space-y-2 flex flex-col items-center justify-center w-full">
                  {renderFileIcon(doc.mimetype)}
                  <p className="font-medium truncate text-center w-full">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{formatMimeType(doc.mimetype)}</p>
                  <p className="text-xs text-muted-foreground">{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ""}</p>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.name) }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              ) : (
                <CardContent className="flex items-center justify-between w-full p-2">
                  <div className="flex items-center gap-4">
                    {renderFileIcon(doc.mimetype)}
                    <div className="space-y-0.5">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{formatMimeType(doc.mimetype)} · {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ""}</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.name) }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

      )}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={async () => {
                if (!confirmDelete) return;
                const { error } = await supabase.storage.from("templates").remove([confirmDelete.name]);
                if (error) {
                  window.debug.log(error);
                  toast.error("Delete failed");
                } else {
                  toast.success("Deleted successfully");
                  // fetchDocuments();
                  removeDocument(confirmDelete.name);
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

function formatMimeType(mimetype: string): string {
  if (mimetype === "application/pdf") return "PDF Document"
  if (mimetype === "application/msword") return "Word Document"
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "Word Document"
  if (mimetype.startsWith("image/")) return "Image"
  return mimetype.split("/")[1]?.toUpperCase() || "File"
}
