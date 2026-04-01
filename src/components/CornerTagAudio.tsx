import { useCallback, useEffect, useRef, useState } from 'react'
import { FaFileAudio } from 'react-icons/fa6'

const AUDIO_SRC = `${import.meta.env.BASE_URL}digicore_tag_v2.mp3`

/** Invisible bottom-left hotspot: hover shows a file chip; double-click plays the tag MP3. */
function CornerTagAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const [open, setOpen] = useState(false)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 220)
  }, [cancelClose])

  const reveal = useCallback(() => {
    cancelClose()
    setOpen(true)
  }, [cancelClose])

  useEffect(() => () => cancelClose(), [cancelClose])

  const play = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => {})
  }, [])

  return (
    <>
      <div
        className="corner-tag-audio"
        onMouseEnter={reveal}
        onMouseLeave={scheduleClose}
      >
        <span className="corner-tag-audio__hit" aria-hidden="true" />
        {open ? (
          <button
            type="button"
            className="corner-tag-audio__pop"
            onMouseEnter={reveal}
            onMouseLeave={scheduleClose}
            onDoubleClick={play}
            aria-label="Play producter_tag.mp3 (double-click)"
          >
            <span className="corner-tag-audio__icon" aria-hidden="true">
              <FaFileAudio />
            </span>
            <span className="corner-tag-audio__name">producter_tag.mp3</span>
            <span className="corner-tag-audio__hint">Double-click to play</span>
          </button>
        ) : null}
      </div>
      <audio ref={audioRef} src={AUDIO_SRC} preload="metadata" />
    </>
  )
}

export default CornerTagAudio
