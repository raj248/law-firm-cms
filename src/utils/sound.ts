// utils/sound.ts

import notificationSound from '@/assets/sounds/notification.mp3'
import infoSound from '@/assets/sounds/info.mp3'
import errorSound from '@/assets/sounds/error.mp3'

// Record of sounds by type
const sounds: Record<string, string> = {
  notification: notificationSound,
  info: infoSound,
  error: errorSound,
}

const audioMap: Record<string, HTMLAudioElement> = {}

export function playSound(type: keyof typeof sounds, volume = 1) {
  try {
    const soundSrc = sounds[type]
    if (!soundSrc) {
      console.warn(`Sound type '${type}' not found.`)
      return
    }

    // Reuse or create Audio object for this type
    if (!audioMap[type]) {
      const audio = new Audio(soundSrc)
      audio.volume = volume
      audioMap[type] = audio
    } else {
      audioMap[type].currentTime = 0 // rewind
      audioMap[type].volume = volume
    }

    audioMap[type]
      .play()
      .catch((e) => console.warn(`Sound play error for '${type}':`, e))
  } catch (e) {
    console.warn(`Sound error for '${type}':`, e)
  }
}
