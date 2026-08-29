import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Gallery } from '../components/gallery'

describe('Gallery', () => {
  const source = [
    { src: 'images/img1.jpg' },
    { src: 'images/img2.jpg' },
    { src: 'images/img3.jpg' }
  ]

  let container: HTMLElement
  let gallery: Gallery

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = '<div class="wrapper"></div>'
    container = document.querySelector('.wrapper') as HTMLElement
  })

  afterEach(() => {
    gallery?.destroy()
    document.body.innerHTML = ''
  })

  it('should initialize gallery with correct source', () => {
    gallery = new Gallery({ container, source })
    expect(gallery).toBeDefined()
  })

  it('should create gallery items with images', () => {
    gallery = new Gallery({ container, source })

    const galleryItems = document.querySelectorAll('.gallery .image')
    expect(galleryItems.length).toBe(3)

    const firstImg = galleryItems[0].querySelector('img')
    expect(firstImg).not.toBeNull()
    expect(firstImg?.src).toContain('images/')
  })

  it('should add "loaded" class when image already complete', async () => {
    const originalComplete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete')
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      get: () => true,
      configurable: true
    })

    gallery = new Gallery({ container, source })
    await Promise.resolve()

    const loadedDivs = document.querySelectorAll('.image.loaded')
    expect(loadedDivs.length).toBe(3)

    Object.defineProperty(HTMLImageElement.prototype, 'complete', originalComplete!)
  })

  it('should destroy and remove container', () => {
    gallery = new Gallery({ container, source })
    gallery.destroy()

    expect(document.querySelector('.gallery-container')).toBeNull()
  })
})
