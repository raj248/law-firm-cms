import { create } from 'zustand'

type UpdateState = {
  updateAvailable: boolean
  version: string
  releaseNotes: string
  releaseName: string
  progress: number
  downloaded: boolean
  setUpdateAvailable: (val: boolean, info?: { version: string; releaseNotes: string; releaseName: string }) => void
  setProgress: (p: number) => void
  setDownloaded: (v: boolean) => void
}

export const useUpdateStore = create<UpdateState>((set) => ({
  updateAvailable: false,
  version: '',
  releaseNotes: "",
  releaseName: "",
  progress: 0,
  downloaded: false,
  setUpdateAvailable: (v, info) =>
    set({
      updateAvailable: v,
      version: info?.version ?? '',
      releaseNotes: info?.releaseNotes ?? '',
      releaseName: info?.releaseName ?? '',
    }),
  setProgress: (p) => set({ progress: p }),
  setDownloaded: (v) => set({ downloaded: v }),
}))
