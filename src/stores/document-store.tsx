import { supabase } from "@/supabase/supabase";
import { DocumentMetadata } from "@/types";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DocumentStore {
  documents: DocumentMetadata[];
  fetchDocuments: () => Promise<void>;
  updateLastAccessed: (id: string) => void;
  updateLocalPath: (id: string, localPath: string) => void; // 👈 Add this
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
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

        window.debug.log("Fetched documents from Supabase", fetchedDocs);

        set((state) => {
          const currentDocs = state.documents;

          const fetchedIds = new Set(fetchedDocs.map((d) => d.id));

          // Remove docs that no longer exist in Supabase
          const filteredDocs = currentDocs.filter((doc) => fetchedIds.has(doc.id));

          // Add new docs from Supabase without overwriting existing data
          fetchedDocs.forEach((fetchedDoc) => {
            const existingDoc = currentDocs.find((doc) => doc.id === fetchedDoc.id);
            if (!existingDoc) {
              filteredDocs.push({
                ...fetchedDoc,
                localPath: "",
                lastAccessed: "",
              });
            }
          });

          window.debug.log("Updated document store after sync", filteredDocs);

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
    }),
    {
      name: "document-store",
      onRehydrateStorage: () => (state) => {
        window.debug?.log("Zustand store rehydrated", state);
      },
    }
  )
);
