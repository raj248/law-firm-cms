import { useEffect } from 'react'
import { useUpdateStore } from '@/stores/update-store'

export const useUpdateListener = () => {
  const setUpdateAvailable = useUpdateStore((s) => s.setUpdateAvailable)
  const setProgress = useUpdateStore((s) => s.setProgress)
  const setDownloaded = useUpdateStore((s) => s.setDownloaded)

  useEffect(() => {
    window.electronUpdater.onUpdateAvailable((_e, info) => {
    setUpdateAvailable(true, {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseName: info.releaseName
    })
  })

    window.electronUpdater.onDownloadProgress((_e, percent) => {
      setProgress(percent)
    })

    window.electronUpdater.onUpdateDownloaded(() => {
      setDownloaded(true)
    })
  }, [])
}
