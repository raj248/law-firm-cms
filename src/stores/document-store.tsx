import { supabase } from "@/supabase/supabase";
import { DocumentMetadata } from "@/types";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DocumentStore {
  documents: DocumentMetadata[];
  fetchDocuments: () => Promise<void>;
  updateLastAccessed: (id: string) => void;
  updateLocalPath: (id: string, localPath: string) => void;
  removeDocument: (id: string) => void;
  handleView: (doc: DocumentMetadata) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],

      fetchDocuments: async () => {
        const { data, error } = await supabase.storage.from("templates").list();
        if (error) {
          window.debug?.log(error);
          toast.error("Failed to fetch documents");
          return;
        }

        const fetchedDocs = (data ?? []).map((d) => ({
          id: d.name,
          name: d.name,
          size: d.metadata?.size ?? 0,
          mimetype: d.metadata?.mimetype ?? "",
        }));

        window.debug?.log("Fetched documents from Supabase", fetchedDocs);

        set((state) => {
          const currentDocs = state.documents;
          const fetchedIds = new Set(fetchedDocs.map((d) => d.id));

          // Remove deleted documents
          const filteredDocs = currentDocs.filter((doc) => fetchedIds.has(doc.id));

          // Add new docs
          fetchedDocs.forEach((fetchedDoc) => {
            const exists = currentDocs.find((doc) => doc.id === fetchedDoc.id);
            if (!exists) {
              filteredDocs.push({
                ...fetchedDoc,
                localPath: "",
                lastAccessed: "",
              });
            }
          });

          return { documents: filteredDocs };
        });

        toast.success("Documents synced with Supabase");
      },

      updateLastAccessed: (name: string) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.name === name ? { ...doc, lastAccessed: new Date().toISOString() } : doc
          ),
        })),

      updateLocalPath: (id: string, localPath: string) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, localPath } : doc
          ),
        })),

      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        })),

      handleView: async (doc) => {
        try {
          const { updateLastAccessed, updateLocalPath } = get();

          if (doc.localPath) {
            const opened = await window.electronAPI.openFile(doc.localPath);
            if (!opened) toast.error("Can't open file");
            updateLastAccessed(doc.name);
            return;
          }

          const { data, error } = await supabase.storage.from("templates").download(doc.name);
          if (error || !data) {
            toast.error("Download failed", { description: error?.message });
            return;
          }

          const arrayBuffer = await data.arrayBuffer();
          const path = await window.electronAPI.saveTempFile(doc.name, arrayBuffer);

          if (path) {
            await window.electronAPI.openFile(path);
            updateLastAccessed(doc.name);
            updateLocalPath(doc.id, path);
          } else {
            toast.error("Can't open file");
          }
        } catch (e) {
          console.error(e);
          toast.error("An error occurred while opening the document.");
        }
      },
    }),
    {
      name: "document-store",
      onRehydrateStorage: () => (state) => {
        window.debug?.log("Zustand store rehydrated", state);
      },
    }
  )
);
