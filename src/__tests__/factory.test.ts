import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { create } from '../factory'
import { emitter } from '../core/emitter'

// Мокаем зависимости
vi.mock('../components/lightbox', () => ({
  Lightbox: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    close: vi.fn(),
    destroy: vi.fn(),
    onViewChange: null,
  }))
}))

vi.mock('../components/gallery', () => ({
  Gallery: vi.fn().mockImplementation(() => {
    const galleryElement = document.createElement('div')
    galleryElement.className = 'gallery-container'
    return {
      galleryElement,
      render: vi.fn(),
      destroy: vi.fn(),
    }
  })
}))

vi.mock('../core/renderer', () => ({
  Renderer: vi.fn().mockImplementation(() => ({
    panTo: vi.fn(),
    panBy: vi.fn(),
    zoom: vi.fn(),
  }))
}))

vi.mock('../core/bindings', () => ({
  Bindings: vi.fn().mockImplementation(() => ({
    track: vi.fn(),
    untrack: vi.fn(),
    dispose: vi.fn(),
    bind: vi.fn(),
  }))
}))

vi.mock('../core/fullscreen', () => ({
  Fullscreen: {
    init: vi.fn(),
    destroy: vi.fn(),
    state: 'off',
    on: vi.fn(() => () => {}),
    off: vi.fn(),
  }
}))

import { Lightbox } from '../components/lightbox'
import { Gallery } from '../components/gallery'
import { Renderer } from '../core/renderer'
import { Bindings } from '../core/bindings'
import { Fullscreen } from '../core/fullscreen'

const mockedLightbox = vi.mocked(Lightbox)
const mockedGallery = vi.mocked(Gallery)
const mockedRenderer = vi.mocked(Renderer)
const mockedBindings = vi.mocked(Bindings)
const mockedFullscreen = vi.mocked(Fullscreen)

describe('Factory', () => {
  const mockSource = [{ src: 'img1.jpg' }, { src: 'img2.jpg' }]

  beforeEach(() => {
    vi.clearAllMocks()
    mockedLightbox.mockClear()
    mockedGallery.mockClear()
    mockedRenderer.mockClear()
    mockedBindings.mockClear()
    mockedFullscreen.init.mockClear()
    mockedFullscreen.destroy.mockClear()

    document.body.innerHTML = `
      <div class="wrapper">
        <input type="checkbox" />
        <button class="refresh-btn">Refresh</button>
      </div>
      <div class="preview-box">
        <img src="" alt="">
        <div class="image-box">
          <div class="pan-overlay"></div>
        </div>
      </div>
      <div class="shadow"></div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create instance and return an app object', () => {
    const app = create({ source: mockSource })

    expect(typeof app.destroy).toBe('function')
    expect(app.gallery).toBeDefined()
    expect(typeof app.setPlugins).toBe('function')
    expect(typeof app.reapplyPlugins).toBe('function')

    expect(mockedFullscreen.init).toHaveBeenCalledTimes(1)
    expect(mockedBindings).toHaveBeenCalledTimes(1)
    expect(mockedRenderer).toHaveBeenCalledTimes(1)
    expect(mockedLightbox).toHaveBeenCalledTimes(1)
    expect(mockedGallery).toHaveBeenCalledTimes(1)
  })

  it('should use custom options', () => {
    create({
      source: mockSource,
      gallerySelector: '.custom-gallery',
      scaleSensitivity: 100,
      minScale: 0.5,
      maxScale: 20,
    })

    expect(mockedRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        scaleSensitivity: 100,
        minScale: 0.5,
        maxScale: 20,
      })
    )
  })

  it('should throw if preview image not found', () => {
    document.body.innerHTML = ''
    expect(() => create({ source: mockSource })).toThrow('Lightbox root element not found')
  })

  it('should call destroy on cleanup function', () => {
    const app = create({ source: mockSource })
    app.destroy()

    expect(mockedGallery).toHaveBeenCalledTimes(1)
    expect(mockedLightbox).toHaveBeenCalledTimes(1)
    expect(mockedFullscreen.destroy).toHaveBeenCalledTimes(1)
  })

  it('should setup gallery click handler and open lightbox', () => {
    create({ source: mockSource })

    // Получаем инстанс Lightbox из мока
    const lightboxInstance = mockedLightbox.mock.results[0].value as {
      open: ReturnType<typeof vi.fn>,
      close: ReturnType<typeof vi.fn>,
      destroy: ReturnType<typeof vi.fn>,
    }
    const mockOpen = vi.fn()
    lightboxInstance.open = mockOpen

    // Добавляем .gallery в galleryElement
    const galleryEl = document.createElement('div')
    galleryEl.className = 'gallery'
    const galleryInstance = mockedGallery.mock.results[0].value as {
      galleryElement: HTMLElement,
      render: ReturnType<typeof vi.fn>,
      destroy: ReturnType<typeof vi.fn>,
    }
    galleryInstance.galleryElement.appendChild(galleryEl)

    emitter.emit('list:created')

    galleryEl.innerHTML = `
      <div class="image">
        <a href="javascript:void(0)">img1.jpg</a>
      </div>
      <div class="image">
        <a href="javascript:void(0)">img2.jpg</a>
      </div>
    `

    const link = galleryEl.querySelector('.image a') as HTMLElement
    link?.click()

    expect(mockOpen).toHaveBeenCalledWith(0, ['img1.jpg', 'img2.jpg'])
  })

  it('should call panBy on overlay mousemove', () => {
    const app = create({ source: mockSource })

    const overlay = document.querySelector('.pan-overlay') as HTMLElement
    const mouseDown = new MouseEvent('mousedown', { button: 0 })
    overlay.dispatchEvent(mouseDown)

    const move = new MouseEvent('mousemove', { bubbles: true })
    Object.defineProperty(move, 'movementX', { value: 10 })
    Object.defineProperty(move, 'movementY', { value: 20 })
    overlay.dispatchEvent(move)

    const rendererInstance = mockedRenderer.mock.results[0].value
    expect(rendererInstance.panBy).toHaveBeenCalledWith({ originX: 10, originY: 20 })

    app.destroy()
  })

  it('should call zoom on overlay wheel', () => {
    const app = create({ source: mockSource })

    const overlay = document.querySelector('.pan-overlay') as HTMLElement
    const wheelEvent = new WheelEvent('wheel', { deltaY: 100, clientX: 50, clientY: 60 })
    overlay.dispatchEvent(wheelEvent)

    const rendererInstance = mockedRenderer.mock.results[0].value
    expect(rendererInstance.zoom).toHaveBeenCalledWith({
      deltaScale: 1,
      x: 50,
      y: 60,
    })

    app.destroy()
  })

  it('should call panTo on overlay dblclick', () => {
    const app = create({ source: mockSource })

    const overlay = document.querySelector('.pan-overlay') as HTMLElement
    overlay.dispatchEvent(new MouseEvent('dblclick'))

    const rendererInstance = mockedRenderer.mock.results[0].value
    expect(rendererInstance.panTo).toHaveBeenCalledWith({ originX: 0, originY: 0, scale: 1 })

    app.destroy()
  })

  it('should resolve ready when DOM is loaded', async () => {
    const readyPromise = (await import('../factory')).ready()
    await expect(readyPromise).resolves.toBeUndefined()
  })
})
