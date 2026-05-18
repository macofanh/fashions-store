let audioContext: AudioContext | null = null

export function playChatNotification() {
    const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    audioContext ??= new AudioContextClass()
    if (audioContext.state === 'suspended') {
        void audioContext.resume()
    }

    const now = audioContext.currentTime

    const notes = [
        { frequency: 1046.5, start: 0, duration: 0.07, peak: 0.08 },
        { frequency: 1318.5, start: 0.08, duration: 0.12, peak: 0.065 },
    ]

    notes.forEach(note => {
        const oscillator = audioContext!.createOscillator()
        const gain = audioContext!.createGain()
        const startAt = now + note.start
        const endAt = startAt + note.duration

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(note.frequency, startAt)

        gain.gain.setValueAtTime(0.0001, startAt)
        gain.gain.exponentialRampToValueAtTime(note.peak, startAt + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt)

        oscillator.connect(gain)
        gain.connect(audioContext!.destination)
        oscillator.start(startAt)
        oscillator.stop(endAt)
    })
}
