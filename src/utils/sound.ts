// utils/sound.ts

let audio: HTMLAudioElement | null = null

export function playNotificationSound(volume = 1) {
  try {
    if (!audio) {
      audio = new Audio('/sounds/new_activity.mp3') // path correct for public/sounds/
      audio.volume = volume
    } else {
      audio.currentTime = 0 // rewind if already loaded
    }
    audio.play().catch((e) => console.warn('Notification sound play error:', e))
  } catch (e) {
    console.warn('Notification sound error:', e)
  }
}
