import { emitter } from './core/emitter'
import { Gallery } from './components/gallery'
import { Lightbox } from './components/lightbox'
import { Bindings } from './core/bindings'
import { Renderer } from './core/renderer'
import './styles/main.scss'

emitter.once('window:loaded', () => {
  const overlay = document.querySelector('.pan-overlay') as HTMLElement

  const lightbox = Lightbox.init(Bindings.init())
  const renderer = new Renderer({
    element: document.querySelector('.preview-box img') as HTMLElement,
    scaleSensitivity: 50,
    minScale: 0.1,
    maxScale: 30
  })

  emitter.on('open', ({ currentIdx, list }: { currentIdx: number, list: string[] }) => {
    lightbox.open(currentIdx, list)
  })

  let down = false

  function panTo() {
    renderer.panTo({ originX: 0, originY: 0, scale: 1 })
  }

  function panBy(e: MouseEvent) {
    e.preventDefault()
    renderer.panBy({
      originX: e.movementX,
      originY: e.movementY,
    })
  }

  function wheel(e: WheelEvent) {
    e.preventDefault()
    renderer.zoom({
      deltaScale: Math.sign(e.deltaY),
      x: e.clientX,
      y: e.clientY,
    })
  }

  function panStart(e: MouseEvent) {
    // Используем современное свойство `e.button`.
    // 0 - основная кнопка (обычно левая).
    if (down || e.button !== 0) return
    overlay.addEventListener('mousemove', panBy, false)
    down = true
  }

  function panStop() {
    overlay.removeEventListener('mousemove', panBy, false)
    down = false
  }

  overlay.addEventListener('mousedown', panStart)
  overlay.addEventListener('mouseup', panStop)
  overlay.addEventListener('dblclick', panTo)
  overlay.addEventListener('wheel', wheel)

  Lightbox.preview = panTo;
});

emitter.on('list:created', () => {
  const galleryEl = document.querySelector('.gallery')
  if (!galleryEl) return

  galleryEl.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement

    if (!['A', 'IMG'].includes(target.tagName)) return

    const link = (target as HTMLImageElement).src || target.textContent || ''
    const data: { list: string[], currentIdx?: number } = { list: [] }

    data.list = [...(galleryEl.children)]
      .map((el, idx) => {
        const child = el.firstElementChild as (HTMLImageElement | HTMLAnchorElement)
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

window.addEventListener('DOMContentLoaded', () => {
  const source = Array.from({ length: 28 }, (_, i) => ({ src: `img-${`${i + 1}`.padStart(2, '0')}.jpg` }))
  new Gallery('.wrapper', 'input[type="checkbox"]', '.refresh-btn', source)
})
