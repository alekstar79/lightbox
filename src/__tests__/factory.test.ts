import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitter } from '../core/emitter'

vi.mock('../components/lightbox', () => ({
  Lightbox: {
    init: vi.fn().mockReturnValue({
      open: vi.fn(),
      close: vi.fn(),
    }),
    preview: vi.fn(),
  }
}))

vi.mock('../components/gallery', () => ({
  Gallery: vi.fn().mockImplementation(() => ({}))
}))

vi.mock('../core/renderer', () => ({
  Renderer: vi.fn().mockImplementation(() => ({
    panTo: vi.fn(),
    panBy: vi.fn(),
    zoom: vi.fn(),
  }))
}))

vi.mock('../core/bindings', () => ({
  Bindings: {
    init: vi.fn().mockReturnValue({
      track: vi.fn(),
      untrack: vi.fn(),
      dispose: vi.fn(),
      bind: vi.fn(),
    })
  }
}))

vi.mock('../core/fullscreen', () => ({
  Fullscreen: vi.fn().mockImplementation(() => ({
    toggle: vi.fn(),
    exit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    get isFullscreen() { return false },
  }))
}))

import { Lightbox } from '../components/lightbox'
import { Gallery } from '../components/gallery'
import { Renderer } from '../core/renderer'
import { Bindings } from '../core/bindings'
import { Fullscreen } from '../core/fullscreen'
import { createLightbox, LightboxApp } from '../factory'

describe('LightboxApp', () => {
  const mockSource = [{ src: 'img1.jpg' }, { src: 'img2.jpg' }]

  beforeEach(() => {
    vi.clearAllMocks()

    document.body.innerHTML = `
      <div class="wrapper">
        <input type="checkbox" />
        <button class="refresh-btn">Refresh</button>
      </div>
      <div class="preview-box">
        <img src="" alt="">
        <div class="pan-overlay"></div>
      </div>
      <div class="shadow"></div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create instance with default options', () => {
    const app = createLightbox({ source: mockSource })

    expect(app).toBeInstanceOf(LightboxApp)
    expect(Fullscreen).toHaveBeenCalledTimes(1)
    expect(Bindings.init).toHaveBeenCalledTimes(1)
    expect(Lightbox.init).toHaveBeenCalledTimes(1)
    expect(Renderer).toHaveBeenCalledTimes(1)
    expect(Renderer).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleSensitivity: 50,
        minScale: 0.1,
        maxScale: 30,
      })
    )
    expect(Gallery).toHaveBeenCalledTimes(1)
    expect(Gallery).toHaveBeenCalledWith(
      '.wrapper',
      'input[type="checkbox"]',
      '.refresh-btn',
      mockSource
    )
  })

  it('should use custom options', () => {
    createLightbox({
      source: mockSource,
      gallerySelector: '.custom-gallery',
      scaleSensitivity: 100,
      minScale: 0.5,
      maxScale: 20,
    })

    expect(Renderer).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleSensitivity: 100,
        minScale: 0.5,
        maxScale: 20,
      })
    )
    expect(Gallery).toHaveBeenCalledWith(
      '.custom-gallery',
      'input[type="checkbox"]',
      '.refresh-btn',
      mockSource
    )
  })

  it('should throw if preview image not found', () => {
    document.body.innerHTML = ''

    expect(() => createLightbox({ source: mockSource })).toThrow('Preview image not found')
  })

  it('should setup gallery click handler after list:created', () => {
    createLightbox({ source: mockSource })

    const wrapper = document.querySelector('.wrapper')
    const galleryEl = document.createElement('div')

    galleryEl.className = 'gallery'
    wrapper?.appendChild(galleryEl)

    emitter.emit('list:created')

    galleryEl.innerHTML = `
      <div class="image">
        <a href="javascript:void(0)">img1.jpg</a>
      </div>
      <div class="image">
        <a href="javascript:void(0)">img2.jpg</a>
      </div>
    `

    const emitSpy = vi.spyOn(emitter, 'emit')
    const link = galleryEl.querySelector('.image a') as HTMLElement

    link?.click()

    expect(emitSpy).toHaveBeenCalledWith('open', {
      currentIdx: 0,
      list: ['img1.jpg', 'img2.jpg'],
    })
  })

  it('should call lightbox.open on open event', () => {
    const mockLightboxOpen = vi.fn()

    vi.mocked(Lightbox.init).mockReturnValueOnce({ open: mockLightboxOpen } as any)

    createLightbox({ source: mockSource })

    emitter.emit('open', { currentIdx: 1, list: ['img1.jpg', 'img2.jpg'] })

    expect(mockLightboxOpen).toHaveBeenCalledWith(1, ['img1.jpg', 'img2.jpg'])
  })

  describe('pan overlay handlers', () => {
    it('should add event listeners to overlay', () => {
      createLightbox({ source: mockSource })

      const overlay = document.querySelector('.pan-overlay')
      expect(overlay).toBeDefined()

      const mockRenderer = vi.mocked(Renderer).mock.results[0].value
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 })

      overlay?.dispatchEvent(mouseDownEvent)

      const moveEvent = new MouseEvent('mousemove', { bubbles: true })
      Object.defineProperty(moveEvent, 'movementX', { value: 10 })
      Object.defineProperty(moveEvent, 'movementY', { value: 20 })

      overlay?.dispatchEvent(moveEvent)

      expect(mockRenderer.panBy).toHaveBeenCalledWith({ originX: 10, originY: 20 })
    })

    it('should handle wheel event', () => {
      createLightbox({ source: mockSource })

      const overlay = document.querySelector('.pan-overlay')
      const mockRenderer = vi.mocked(Renderer).mock.results[0].value
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100, clientX: 50, clientY: 60 })

      overlay?.dispatchEvent(wheelEvent)

      expect(mockRenderer.zoom).toHaveBeenCalledWith({
        deltaScale: 1,
        x: 50,
        y: 60,
      })
    })

    it('should handle double click', () => {
      createLightbox({ source: mockSource })

      const overlay = document.querySelector('.pan-overlay')
      const mockRenderer = vi.mocked(Renderer).mock.results[0].value

      overlay?.dispatchEvent(new MouseEvent('dblclick'))

      expect(mockRenderer.panTo).toHaveBeenCalledWith({ originX: 0, originY: 0, scale: 1 })
    })

    it('should set Lightbox.preview to panTo', () => {
      createLightbox({ source: mockSource })

      expect(Lightbox.preview).toBeDefined()
      const mockRenderer = vi.mocked(Renderer).mock.results[0].value
      ;(Lightbox.preview as any)()

      expect(mockRenderer.panTo).toHaveBeenCalledWith({ originX: 0, originY: 0, scale: 1 })
    })
  })

  describe('destroy', () => {
    it('should untrack and dispose bindings', () => {
      const app = createLightbox({ source: mockSource })
      const mockBindings = vi.mocked(Bindings.init).mock.results[0].value

      app.destroy()

      expect(mockBindings.untrack).toHaveBeenCalled()
      expect(mockBindings.dispose).toHaveBeenCalled()
    })

    it('should replace overlay to remove listeners', () => {
      const app = createLightbox({ source: mockSource })
      const overlay = document.querySelector('.pan-overlay')
      const parent = overlay?.parentNode

      app.destroy()

      const newOverlay = parent?.querySelector('.pan-overlay')
      expect(newOverlay).toBeDefined()
      expect(newOverlay).not.toBe(overlay)
    })
  })
})
