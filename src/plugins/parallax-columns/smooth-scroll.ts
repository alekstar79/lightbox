export interface SmoothScrollOptions {
  duration?: number
  easing?: (t: number) => number
}

const defaultEasing = (t: number): number =>
  Math.min(1, 1.001 - 2 ** (-10 * t))

function computeMaxScroll(): number {
  const { body, documentElement: html } = document
  const contentHeight = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight,
  )
  return Math.max(1, contentHeight - window.innerHeight)
}

export class SmoothScroll {
  private readonly duration: number
  private readonly easing: (t: number) => number

  private currentScroll = 0
  private targetScroll = 0
  private animationFrom = 0
  private animationStart = 0
  private isAnimating = false
  private maxScroll = 1
  private active = false

  constructor(options: SmoothScrollOptions = {}) {
    this.duration = options.duration ?? 3
    this.easing = options.easing ?? defaultEasing
    this.handleWheel = this.handleWheel.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
  }

  public start(): void {
    if (this.active) return

    this.active = true

    this.currentScroll = window.scrollY
    this.targetScroll = this.currentScroll
    this.animationFrom = this.currentScroll
    this.recalc()

    window.addEventListener('wheel', this.handleWheel, { passive: false })
    window.addEventListener('scroll', this.handleScroll, { passive: true })
  }

  public stop(): void {
    if (!this.active) return

    this.active = false

    window.removeEventListener('wheel', this.handleWheel)
    window.removeEventListener('scroll', this.handleScroll)
  }

  public recalc(): void {
    this.maxScroll = computeMaxScroll()

    if (this.targetScroll > this.maxScroll) {
      this.targetScroll = this.maxScroll
    }
  }

  public tick(now: number): void {
    if (!this.isAnimating) return

    const progress = Math.min(1, (now - this.animationStart) / 1000 / this.duration)

    this.currentScroll =
      this.animationFrom +
      (this.targetScroll - this.animationFrom) * this.easing(progress)

    if (progress >= 1) {
      this.currentScroll = this.targetScroll
      this.isAnimating = false
    }

    window.scrollTo(0, this.currentScroll)
  }

  private handleWheel(e: WheelEvent): void {
    if (e.ctrlKey || document.body.style.overflow === 'hidden') return

    e.preventDefault()

    const next = Math.max(0, Math.min(this.targetScroll + e.deltaY, this.maxScroll))

    if (next === this.targetScroll) return

    this.targetScroll = next
    this.animationFrom = this.currentScroll
    this.animationStart = performance.now()
    this.isAnimating = true
  }

  private handleScroll(): void {
    if (!this.isAnimating) {
      this.currentScroll = window.scrollY
      this.targetScroll = this.currentScroll
      this.animationFrom = this.currentScroll
    }
  }
}
