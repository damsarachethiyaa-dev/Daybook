interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  vr: number
  shape: 'rect' | 'circle'
}

const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15', '#22d3ee']

let activeCanvas: HTMLCanvasElement | null = null

export function fireConfetti(durationMs = 1600): void {
  // Restart instead of stacking if a burst is already running.
  if (activeCanvas) {
    activeCanvas.remove()
    activeCanvas = null
  }

  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;'
  document.body.appendChild(canvas)
  activeCanvas = canvas

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    activeCanvas = null
    return
  }

  const cx = canvas.width / 2
  const particles: Particle[] = []
  for (let i = 0; i < 140; i++) {
    const angle = Math.random() * Math.PI - Math.PI // upward half
    const speed = 6 + Math.random() * 9
    particles.push({
      x: cx + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35 + Math.random() * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    })
  }

  const start = performance.now()

  function tick(now: number): void {
    if (!ctx) return
    const elapsed = now - start
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const fade = Math.max(0, 1 - elapsed / durationMs)
    for (const p of particles) {
      p.vy += 0.25 // gravity
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr

      ctx.save()
      ctx.globalAlpha = fade
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    if (elapsed < durationMs && activeCanvas === canvas) {
      requestAnimationFrame(tick)
    } else if (activeCanvas === canvas) {
      canvas.remove()
      activeCanvas = null
    }
  }

  requestAnimationFrame(tick)
}
