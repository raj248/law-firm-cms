// utils/sound.ts

import notificationSound from '@/assets/sounds/new_activity.mp3'

let audio: HTMLAudioElement | null = null

export function playNotificationSound(volume = 1) {
  try {
    if (!audio) {
      audio = new Audio(notificationSound) // imported path resolves correctly
      audio.volume = volume
    } else {
      audio.currentTime = 0 // rewind if already loaded
    }
    audio.play().catch((e) => console.warn('Notification sound play error:', e))
  } catch (e) {
    console.warn('Notification sound error:', e)
  }
}
