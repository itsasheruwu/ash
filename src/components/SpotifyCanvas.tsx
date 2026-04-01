import { useEffect, useRef } from 'react'

type Particle = {
  seedX: number
  seedY: number
  speed: number
  radius: number
  alpha: number
  drift: number
}

const LOOP_MS = 9000
const TAU = Math.PI * 2

const particles: Particle[] = Array.from({ length: 48 }, (_, index) => {
  const seed = (index + 1) * 0.618034

  return {
    seedX: (Math.sin(seed * 12.9898) + 1) / 2,
    seedY: (Math.cos(seed * 78.233) + 1) / 2,
    speed: 0.18 + (index % 5) * 0.06,
    radius: 0.6 + (index % 4) * 0.35,
    alpha: 0.05 + (index % 7) * 0.01,
    drift: 0.6 + (index % 6) * 0.12,
  }
})

function fitCover(
  sourceWidth: number,
  sourceHeight: number,
  destinationWidth: number,
  destinationHeight: number,
) {
  const sourceRatio = sourceWidth / sourceHeight
  const destinationRatio = destinationWidth / destinationHeight

  let sx = 0
  let sy = 0
  let sw = sourceWidth
  let sh = sourceHeight

  if (sourceRatio > destinationRatio) {
    sw = sourceHeight * destinationRatio
    sx = (sourceWidth - sw) / 2
  } else {
    sh = sourceWidth / destinationRatio
    sy = (sourceHeight - sh) / 2
  }

  return { sx, sy, sw, sh }
}

function createNoiseCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext('2d')

  if (!context) {
    return canvas
  }

  const imageData = context.createImageData(canvas.width, canvas.height)

  for (let index = 0; index < imageData.data.length; index += 4) {
    const shade = 150 + Math.floor(Math.random() * 90)
    imageData.data[index] = shade
    imageData.data[index + 1] = shade
    imageData.data[index + 2] = shade
    imageData.data[index + 3] = Math.floor(Math.random() * 34)
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}

function SpotifyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return undefined
    }

    const image = new Image()
    image.src = `${import.meta.env.BASE_URL}spotify-canvas-cover.jpg`

    const noiseCanvas = createNoiseCanvas()
    const noisePattern = context.createPattern(noiseCanvas, 'repeat')
    const scanlineCanvas = document.createElement('canvas')
    scanlineCanvas.width = 8
    scanlineCanvas.height = 8
    const scanlineContext = scanlineCanvas.getContext('2d')

    if (scanlineContext) {
      scanlineContext.fillStyle = 'rgba(255, 255, 255, 0.04)'
      scanlineContext.fillRect(0, 0, scanlineCanvas.width, 1)
      scanlineContext.fillStyle = 'rgba(0, 0, 0, 0.04)'
      scanlineContext.fillRect(0, 4, scanlineCanvas.width, 1)
    }

    const scanlinePattern =
      scanlineContext !== null
        ? context.createPattern(scanlineCanvas, 'repeat')
        : null

    let animationFrame = 0
    let imageReady = false
    let width = 0
    let height = 0

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const scale = window.devicePixelRatio || 1
      width = Math.max(1, Math.floor(bounds.width * scale))
      height = Math.max(1, Math.floor(bounds.height * scale))
      canvas.width = width
      canvas.height = height
    }

    const drawImageCover = (
      drawContext: CanvasRenderingContext2D,
      source: HTMLImageElement | HTMLCanvasElement,
      destinationX: number,
      destinationY: number,
      destinationWidth: number,
      destinationHeight: number,
    ) => {
      const { sx, sy, sw, sh } = fitCover(
        source.width,
        source.height,
        destinationWidth,
        destinationHeight,
      )

      drawContext.drawImage(
        source,
        sx,
        sy,
        sw,
        sh,
        destinationX,
        destinationY,
        destinationWidth,
        destinationHeight,
      )
    }

    const drawFrame = (now: number) => {
      if (!width || !height) {
        return
      }

      const phase = ((now % LOOP_MS) / LOOP_MS) * TAU
      const pulse = 0.5 + 0.5 * Math.sin(phase)
      const driftX = Math.sin(phase * 0.7) * width * 0.016
      const driftY = Math.cos(phase * 0.53) * height * 0.01
      const backgroundScale = 1.18 + pulse * 0.02

      context.clearRect(0, 0, width, height)

      context.fillStyle = '#050505'
      context.fillRect(0, 0, width, height)

      if (imageReady) {
        context.save()
        context.filter = 'blur(34px) brightness(0.58) contrast(1.18)'
        context.globalAlpha = 0.94
        const backgroundWidth = width * backgroundScale
        const backgroundHeight = height * backgroundScale
        drawImageCover(
          context,
          image,
          (width - backgroundWidth) / 2 + driftX * 0.15,
          (height - backgroundHeight) / 2 + driftY * 0.15,
          backgroundWidth,
          backgroundHeight,
        )
        context.restore()

        context.save()
        const backgroundGlow = context.createRadialGradient(
          width * (0.5 + 0.04 * Math.sin(phase * 0.61)),
          height * (0.43 + 0.03 * Math.cos(phase * 0.47)),
          0,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.7,
        )
        backgroundGlow.addColorStop(0, 'rgba(255, 255, 255, 0.10)')
        backgroundGlow.addColorStop(0.36, 'rgba(255, 255, 255, 0.04)')
        backgroundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        context.fillStyle = backgroundGlow
        context.fillRect(0, 0, width, height)
        context.restore()
      }

      if (scanlinePattern) {
        context.save()
        context.globalAlpha = 0.18
        context.translate(0, (now * 0.018) % 8)
        context.fillStyle = scanlinePattern
        context.fillRect(0, 0, width, height)
        context.restore()
      }

      if (noisePattern) {
        context.save()
        context.globalAlpha = 0.14
        context.translate(
          (now * 0.014) % noiseCanvas.width,
          (now * 0.01) % noiseCanvas.height,
        )
        context.fillStyle = noisePattern
        context.fillRect(
          -noiseCanvas.width,
          -noiseCanvas.height,
          width + noiseCanvas.width * 2,
          height + noiseCanvas.height * 2,
        )
        context.restore()
      }

      if (imageReady) {
        const artSize = Math.min(width * 0.78, height * 0.56)
        const artX = (width - artSize) / 2 + driftX
        const artY = (height - artSize) / 2 + driftY

        context.save()
        context.shadowColor = 'rgba(0, 0, 0, 0.65)'
        context.shadowBlur = 38
        context.shadowOffsetY = 26
        context.fillStyle = 'rgba(0, 0, 0, 0.28)'
        context.fillRect(artX, artY, artSize, artSize)
        context.restore()

        context.save()
        context.beginPath()
        const radius = artSize * 0.045
        context.roundRect(artX, artY, artSize, artSize, radius)
        context.clip()
        drawImageCover(context, image, artX, artY, artSize, artSize)
        context.restore()

        context.save()
        context.globalCompositeOperation = 'screen'
        const sheen = context.createLinearGradient(
          artX - artSize * 0.1 + Math.sin(phase) * artSize * 0.12,
          artY,
          artX + artSize * 0.65,
          artY + artSize,
        )
        sheen.addColorStop(0, 'rgba(255, 255, 255, 0)')
        sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0.07)')
        sheen.addColorStop(0.55, 'rgba(255, 255, 255, 0.02)')
        sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
        context.fillStyle = sheen
        context.fillRect(artX, artY, artSize, artSize)
        context.restore()

        context.save()
        context.globalCompositeOperation = 'multiply'
        const shadow = context.createRadialGradient(
          width * 0.5,
          height * 0.56,
          artSize * 0.12,
          width * 0.5,
          height * 0.56,
          artSize * 0.8,
        )
        shadow.addColorStop(0, 'rgba(0, 0, 0, 0)')
        shadow.addColorStop(1, 'rgba(0, 0, 0, 0.28)')
        context.fillStyle = shadow
        context.fillRect(0, 0, width, height)
        context.restore()
      }

      context.save()
      context.globalCompositeOperation = 'multiply'
      const vignette = context.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.26,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75,
      )
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vignette.addColorStop(0.72, 'rgba(0, 0, 0, 0.08)')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.56)')
      context.fillStyle = vignette
      context.fillRect(0, 0, width, height)
      context.restore()

      context.save()
      context.globalCompositeOperation = 'screen'
      context.globalAlpha = 0.3
      const light = context.createLinearGradient(
        width * (0.06 + 0.04 * Math.sin(phase * 0.37)),
        height * (0.08 + 0.03 * Math.cos(phase * 0.29)),
        width * (0.94 - 0.05 * Math.sin(phase * 0.53)),
        height * (0.92 - 0.04 * Math.cos(phase * 0.4)),
      )
      light.addColorStop(0, 'rgba(255, 255, 255, 0)')
      light.addColorStop(0.38, 'rgba(255, 255, 255, 0.03)')
      light.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)')
      light.addColorStop(0.62, 'rgba(255, 255, 255, 0.03)')
      light.addColorStop(1, 'rgba(255, 255, 255, 0)')
      context.fillStyle = light
      context.fillRect(0, 0, width, height)
      context.restore()

      context.save()
      context.globalAlpha = 0.85
      context.fillStyle = 'rgba(255, 255, 255, 0.08)'
      for (const particle of particles) {
        const x =
          ((particle.seedX + Math.sin(phase * particle.speed) * 0.02) %
            1 +
            1) %
          1
        const y =
          ((particle.seedY +
            phase * 0.05 * particle.drift +
            Math.cos(phase * particle.speed) * 0.01) %
            1 +
            1) %
          1
        const px = x * width + Math.sin(phase * particle.speed * 2) * width * 0.04
        const py = y * height
        context.globalAlpha = particle.alpha
        context.beginPath()
        context.arc(px, py, particle.radius * (width / 1080), 0, TAU)
        context.fill()
      }
      context.restore()

      animationFrame = window.requestAnimationFrame(drawFrame)
    }

    const onLoad = () => {
      imageReady = true
      resize()
      animationFrame = window.requestAnimationFrame(drawFrame)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    if (image.complete) {
      onLoad()
    } else {
      image.addEventListener('load', onLoad, { once: true })
    }

    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      image.removeEventListener('load', onLoad)
    }
  }, [])

  return (
    <div className="canvas-stage" aria-label="Animated Spotify canvas preview">
      <canvas ref={canvasRef} className="canvas-surface" />
    </div>
  )
}

export default SpotifyCanvas
