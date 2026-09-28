import { Plugin, PluginContext } from '../../core/plugin'
import { Gallery } from '../../components/gallery'
import { emitter } from '../../core/emitter'
import { SmoothScroll } from './smooth-scroll'
import { measureColumns } from './columns'

export interface ParallaxColumnsOptions {
  smoothScroll?: boolean
  scrollDuration?: number
  scrollEasing?: (t: number) => number
  clipMargin?: number
}

interface ResolvedOptions {
  smoothScroll: boolean
  scrollDuration: number
  scrollEasing: (t: number) => number
  clipMargin: number
}

export class ParallaxColumnsPlugin implements Plugin {
  public readonly name = 'parallax-columns'

  private readonly options: ResolvedOptions
  private gallery: Gallery | null = null
  private containerEl: HTMLElement | null = null
  private gridEl: HTMLElement | null = null

  private items: HTMLElement[] = []
  private itemDeltas: number[] = []
  private maxScroll = 1
  private lastScrollY = -1

  private smoothScroll: SmoothScroll | null = null
  private resizeObserver: ResizeObserver | null = null
  private rafId: number | null = null
  private measureScheduled = false

  private unsubscribeList: (() => void) | null = null

  private savedStyles: {
    height: string
    overflow: string
    overflowClipMargin: string
  } | null = null

  constructor(options: ParallaxColumnsOptions = {}) {
    this.options = {
      smoothScroll: options.smoothScroll ?? true,
      scrollDuration: options.scrollDuration ?? 3,
      scrollEasing: options.scrollEasing ?? ((t) => Math.min(1, 1.001 - 2 ** (-10 * t))),
      clipMargin: options.clipMargin ?? 60
    }
  }

  public apply(context: PluginContext): void {
    this.gallery = context.gallery
    this.containerEl = this.gallery.galleryElement

    if (this.options.smoothScroll) {
      this.smoothScroll = new SmoothScroll({
        duration: this.options.scrollDuration,
        easing: this.options.scrollEasing,
      })

      this.smoothScroll.start()
    }

    this.unsubscribeList = emitter.on('list:created', this.handleListCreated)
    window.addEventListener('resize', this.handleResize)

    this.attachGrid()
    this.startRaf()
  }

  public destroy(): void {
    this.stopRaf()
    this.unsubscribeList?.()
    this.unsubscribeList = null

    window.removeEventListener('resize', this.handleResize)

    this.detachGrid()
    this.clearTransforms()

    if (this.containerEl && this.savedStyles) {
      this.containerEl.style.height = this.savedStyles.height
      this.containerEl.style.overflow = this.savedStyles.overflow

      if (this.savedStyles.overflowClipMargin) {
        this.containerEl.style.setProperty(
          'overflow-clip-margin',
          this.savedStyles.overflowClipMargin,
        )
      } else {
        this.containerEl.style.removeProperty('overflow-clip-margin')
      }
    }

    this.savedStyles = null

    this.smoothScroll?.stop()
    this.smoothScroll = null

    this.gallery = null
    this.containerEl = null
  }

  // Events
  private readonly handleListCreated = (): void => {
    this.detachGrid()
    requestAnimationFrame(() => this.attachGrid())
  }

  private readonly handleResize = (): void => {
    this.smoothScroll?.recalc()
    this.scheduleMeasure()
  }

  // Attachment / detachment of the grid
  private attachGrid(): void {
    if (!this.containerEl) return

    const grid = this.containerEl.querySelector<HTMLElement>('.gallery')
    if (!grid) return

    this.gridEl = grid

    if (!this.savedStyles) {
      this.savedStyles = {
        height: this.containerEl.style.height,
        overflow: this.containerEl.style.overflow,
        overflowClipMargin: this.containerEl.style.getPropertyValue('overflow-clip-margin')
      }
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure())
      this.resizeObserver.observe(grid)
    }

    this.measure()
  }

  private detachGrid(): void {
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.gridEl = null
  }

  // Measurement
  private scheduleMeasure(): void {
    if (this.measureScheduled) return

    this.measureScheduled = true
    requestAnimationFrame(() => {
      this.measureScheduled = false
      this.measure()
    })
  }

  private measure(): void {
    if (!this.gridEl || !this.containerEl) return

    // Reset the transforms - otherwise, getBoundingClientRect will return shifted coordinates
    const allItems = this.gridEl.querySelectorAll<HTMLElement>('.image')
    for (const item of allItems) {
      if (item.style.transform) item.style.transform = ''
    }

    const layout = measureColumns(this.gridEl)
    if (!layout) return

    const gridRect = this.gridEl.getBoundingClientRect()
    const containerRect = this.containerEl.getBoundingClientRect()
    const offset = gridRect.top - containerRect.top
    const newHeight = layout.minBottom + offset

    this.containerEl.style.height = `${Math.round(newHeight)}px`
    this.containerEl.style.overflow = 'clip'
    this.containerEl.style.setProperty(
      'overflow-clip-margin',
      `${this.options.clipMargin}px`,
    )

    const items = Array.from(allItems)
    const deltas: number[] = new Array(items.length).fill(0)

    items.forEach((item, idx) => {
      deltas[idx] = layout.itemDeltas.get(item) ?? 0
    })

    this.items = items
    this.itemDeltas = deltas
    this.lastScrollY = -1

    this.updateMaxScroll()
    this.smoothScroll?.recalc()
    this.applyTransforms()
  }

  private clearTransforms(): void {
    for (const item of this.items) {
      item.style.transform = ''
    }

    this.items = []
    this.itemDeltas = []
  }

  // Rendering of transforms
  private updateMaxScroll(): void {
    const { body, documentElement: html } = document
    const contentHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    )

    this.maxScroll = Math.max(1, contentHeight - window.innerHeight)
  }

  private applyTransforms(): void {
    if (this.items.length === 0) return

    const scrollY = window.scrollY
    if (scrollY === this.lastScrollY) return

    this.lastScrollY = scrollY

    const progress = Math.max(0, Math.min(1, scrollY / this.maxScroll))

    for (let i = 0; i < this.items.length; i++) {
      const delta = this.itemDeltas[i]

      this.items[i].style.transform = delta > 0
        ? `translate3d(0, ${(-delta * progress).toFixed(2)}px, 0)`
        : ''
    }
  }

  // rAF loop
  private startRaf(): void {
    if (this.rafId !== null) return

    const loop = (now: number): void => {
      this.smoothScroll?.tick(now)
      this.applyTransforms()
      this.rafId = requestAnimationFrame(loop)
    }

    this.rafId = requestAnimationFrame(loop)
  }

  private stopRaf(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
