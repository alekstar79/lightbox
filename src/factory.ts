import { Plugin, PluginContext } from './core/plugin'

import { Gallery, ImageSource } from './components/gallery'
import { Lightbox, LightboxDependencies } from './components/lightbox'
import { Bindings } from './core/bindings'
import { Renderer } from './core/renderer'
import { Fullscreen } from './core/fullscreen'
import { emitter } from './core/emitter'

export interface LightboxOptions {
  source: ImageSource[];
  gallerySelector?: string;
  scaleSensitivity?: number;
  minScale?: number;
  maxScale?: number;
  setupFn?: (gallery: Gallery) => void;
  plugins?: Plugin[];
}

export interface LightboxApp {
  destroy: () => void;
  gallery: Gallery;
  setPlugins: (plugins: Plugin[]) => void;
  reapplyPlugins: () => void;
}

export function create(options: LightboxOptions): LightboxApp {
  const {
    gallerySelector = '.wrapper',
    scaleSensitivity = 50,
    minScale = 0.1,
    maxScale = 30,
    source,
    setupFn,
    plugins = [],
  } = options

  Fullscreen.init()

  const root = document.querySelector('.preview-box') as HTMLElement
  if (!root) throw new Error('Lightbox root element not found')

  const deps: LightboxDependencies = {
    root,
    shadow: document.querySelector('.shadow') as HTMLElement,
    imageBox: root.querySelector('.image-box') as HTMLElement,
    image: root.querySelector('img') as HTMLImageElement,
    currentCounter: root.querySelector('.current-img') as HTMLElement,
    totalCounter: root.querySelector('.total-img') as HTMLElement,
    expandBtn: root.querySelector('.fa-expand') as HTMLElement,
    closeBtn: root.querySelector('.fa-times') as HTMLElement,
    prevBtn: root.querySelector('.prev') as HTMLElement,
    nextBtn: root.querySelector('.next') as HTMLElement
  }

  const bindings = new Bindings()
  const renderer = new Renderer({ element: deps.image, minScale, maxScale, scaleSensitivity })
  const lightbox = new Lightbox({ deps, keyboard: bindings })

  const container = document.querySelector(gallerySelector) as HTMLElement
  const gallery = new Gallery({
    container,
    source,
    setupFn: (galleryInstance) => {
      setupFn?.(galleryInstance)
    }
  })

  lightbox.onViewChange = () => renderer.panTo({ originX: 0, originY: 0, scale: 1 })

  const context: PluginContext = {
    root: document.body,
    gallery,
    lightbox,
    renderer,
    emitter
  }

  let activePlugins: Plugin[] = [...plugins]

  activePlugins.forEach(plugin => plugin.apply(context))

  const unsubscribeList = emitter.on('list:created', () => {
    const galleryEl = gallery.galleryElement.querySelector('.gallery')

    if (!galleryEl) return

    galleryEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement

      if (!['A', 'IMG'].includes(target.tagName)) return

      const link = (target as HTMLImageElement).src || target.textContent || ''
      const list: string[] = []

      let clickedIndex: number | undefined

      [...galleryEl.children].forEach((el, idx) => {
        const child = el.firstElementChild as HTMLImageElement | HTMLAnchorElement
        const src = child ? (child as HTMLImageElement).src || child.textContent : ''

        if (src && link.includes(src)) {
          clickedIndex = idx
        }

        list.push(src)
      })

      if (clickedIndex !== undefined) {
        lightbox.open(clickedIndex, list)
      }
    })
  })

  const overlay = deps.imageBox.querySelector('.pan-overlay') as HTMLElement
  let overlayCleanup: (() => void) | null = null

  if (overlay) {
    let down = false

    const panTo = () => renderer.panTo({ originX: 0, originY: 0, scale: 1 })
    const panBy = (e: MouseEvent) => {
      e.preventDefault()
      renderer.panBy({ originX: e.movementX, originY: e.movementY })
    }

    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      renderer.zoom({ deltaScale: Math.sign(e.deltaY), x: e.clientX, y: e.clientY })
    }

    const panStart = (e: MouseEvent) => {
      if (down || e.button !== 0) return
      overlay.addEventListener('mousemove', panBy as EventListener, false)
      down = true
    }

    const panStop = () => {
      overlay.removeEventListener('mousemove', panBy as EventListener, false)
      down = false
    }

    overlay.addEventListener('mousedown', panStart as EventListener)
    overlay.addEventListener('mouseup', panStop as EventListener)
    overlay.addEventListener('dblclick', panTo as EventListener)
    overlay.addEventListener('wheel', wheel as EventListener)

    overlayCleanup = () => {
      overlay.removeEventListener('mousedown', panStart as EventListener)
      overlay.removeEventListener('mouseup', panStop as EventListener)
      overlay.removeEventListener('dblclick', panTo as EventListener)
      overlay.removeEventListener('wheel', wheel as EventListener)
      overlay.removeEventListener('mousemove', panBy as EventListener, false)
    }
  }

  const setPlugins = (newPlugins: Plugin[]) => {
    activePlugins.forEach(plugin => plugin.destroy?.())
    activePlugins = [...newPlugins]
    activePlugins.forEach(plugin => plugin.apply(context))
  }

  const reapplyPlugins = () => {
    activePlugins.forEach(plugin => plugin.destroy?.())
    activePlugins.forEach(plugin => plugin.apply(context))
  }

  const destroy = () => {
    gallery.destroy()
    lightbox.destroy()

    Fullscreen.destroy()
    unsubscribeList()
    overlayCleanup?.()

    activePlugins.forEach(plugin => {
      plugin.destroy?.()
    })
  }

  return { gallery, destroy, setPlugins, reapplyPlugins }
}

export function ready(): Promise<void> {
  return new Promise((resolve: () => void) => {
    if (document.readyState !== 'loading') {
      resolve()
    } else {
      document.addEventListener('DOMContentLoaded', resolve, { once: true })
    }
  })
}
