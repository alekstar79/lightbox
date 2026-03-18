import { Gallery, ImageSource } from './components/gallery'
import { Lightbox } from './components/lightbox'
import { Bindings } from './core/bindings'
import { Renderer } from './core/renderer'
import { Fullscreen } from './core/fullscreen'
import { emitter } from './core/emitter'

export interface LightboxOptions {
  /**
   * Селектор для контейнера галереи (по умолчанию '.wrapper')
   */
  gallerySelector?: string
  /**
   * Массив источников изображений
   */
  source: ImageSource[]
  /**
   * Чувствительность масштабирования (по умолчанию 50)
   */
  scaleSensitivity?: number
  /**
   * Минимальный масштаб (по умолчанию 0.1)
   */
  minScale?: number
  /**
   * Максимальный масштаб (по умолчанию 30)
   */
  maxScale?: number
}

export class LightboxApp {
  private lightbox: Lightbox

  private readonly renderer: Renderer
  private readonly bindings: Bindings
  private readonly fullscreen: Fullscreen
  private readonly overlay: HTMLElement | null

  constructor(options: LightboxOptions) {
    const {
      gallerySelector = '.wrapper',
      source,
      scaleSensitivity = 50,
      minScale = 0.1,
      maxScale = 30,
    } = options

    this.fullscreen = new Fullscreen()
    this.bindings = Bindings.init()
    this.lightbox = Lightbox.init(this.bindings, this.fullscreen)

    const previewImg = document.querySelector('.preview-box img') as HTMLElement
    if (!previewImg) {
      throw new Error('Preview image not found')
    }

    this.renderer = new Renderer({
      element: previewImg,
      scaleSensitivity,
      minScale,
      maxScale,
    })

    new Gallery(
      gallerySelector,
      'input[type="checkbox"]',
      '.refresh-btn',
      source
    )

    this.overlay = document.querySelector('.pan-overlay')
    this.setupEvents()
    this.setupGalleryClick()
  }

  private setupGalleryClick(): void {
    emitter.on('list:created', () => {
      const galleryEl = document.querySelector('.gallery')
      if (!galleryEl) return

      galleryEl.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement

        if (!['A', 'IMG'].includes(target.tagName)) return

        const link = (target as HTMLImageElement).src || target.textContent || ''
        const data: { list: string[]; currentIdx?: number } = { list: [] }

        data.list = [...galleryEl.children].map((el, idx) => {
          const child = el.firstElementChild as HTMLImageElement | HTMLAnchorElement
          const src = child ? (child as HTMLImageElement).src || child.textContent : ''

          if (src && link.includes(src)) {
            data.currentIdx = idx
          }

          return src || ''
        })

        if (data.currentIdx !== undefined) {
          emitter.emit('open', { currentIdx: data.currentIdx, list: data.list })
        }
      })
    })
  }

  private setupEvents(): void {
    emitter.on('open', ({ currentIdx, list }: { currentIdx: number; list: string[] }) => {
      this.lightbox.open(currentIdx, list)
    })

    if (this.overlay && this.renderer) {
      let down = false

      const panTo = (): void => {
        this.renderer.panTo({ originX: 0, originY: 0, scale: 1 })
      }

      const panBy = (e: MouseEvent): void => {
        e.preventDefault()
        this.renderer.panBy({
          originX: e.movementX,
          originY: e.movementY,
        })
      }

      const wheel = (e: WheelEvent): void => {
        e.preventDefault()
        this.renderer.zoom({
          deltaScale: Math.sign(e.deltaY),
          x: e.clientX,
          y: e.clientY,
        })
      }

      const panStart = (e: MouseEvent): void => {
        if (down || e.button !== 0) return
        this.overlay?.addEventListener('mousemove', panBy, false)
        down = true
      }

      const panStop = (): void => {
        this.overlay?.removeEventListener('mousemove', panBy, false)
        down = false
      }

      this.overlay.addEventListener('mousedown', panStart)
      this.overlay.addEventListener('mouseup', panStop)
      this.overlay.addEventListener('dblclick', panTo)
      this.overlay.addEventListener('wheel', wheel)

      Lightbox.preview = panTo
    }
  }

  public destroy(): void {
    this.bindings.untrack()
    this.bindings.dispose()

    if (this.overlay) {
      const newOverlay = this.overlay.cloneNode(false)
      this.overlay.parentNode?.replaceChild(newOverlay, this.overlay)
    }
  }
}

export function createLightbox(options: LightboxOptions): LightboxApp {
  return new LightboxApp(options)
}
