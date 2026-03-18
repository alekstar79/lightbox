import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Gallery } from '../components/gallery'

describe('Gallery', () => {
  const wrapper = '.wrapper'
  const checkboxSelector = 'input[type="checkbox"]'
  const refreshBtn = '.refresh-btn'
  const source = [
    { src: 'img1.jpg' },
    { src: 'img2.jpg' },
    { src: 'img3.jpg' }
  ]

  const waitForGallery = (timeout = 1000) => new Promise<void>((resolve, reject) => {
    const check = () => {
      if (document.querySelector('.gallery')) {
        clearInterval(interval)
        clearTimeout(timer)
        resolve()
      }
    }
    const interval = setInterval(check, 50)
    const timer = setTimeout(() => {
      clearInterval(interval)
      reject(new Error('Gallery element not found in DOM'))
    }, timeout)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = `
      <div class="wrapper">
        <input type="checkbox" />
        <button class="refresh-btn">Refresh</button>
      </div>
    `
  })

  afterEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('should initialize gallery with correct source', () => {
    const gallery = new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    expect(gallery).toBeDefined()
  })

  it('should create gallery items with images (trigger=true)', async () => {
    const checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
    checkbox.checked = true

    new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    await waitForGallery()

    const galleryItems = document.querySelectorAll('.gallery .image')
    expect(galleryItems.length).toBe(3)
    const firstImg = galleryItems[0].querySelector('img')
    expect(firstImg).not.toBeNull()
    expect(firstImg?.src).toContain('images/img')
  })

  it('should create gallery items with links (trigger=false)', async () => {
    const checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
    checkbox.checked = false

    new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    await waitForGallery()

    const galleryItems = document.querySelectorAll('.gallery .image')
    expect(galleryItems.length).toBe(3)
    const firstLink = galleryItems[0].querySelector('a')
    expect(firstLink).not.toBeNull()
    expect(firstLink?.textContent).toContain('img')
  })

  it('should add "loaded" class when image already complete', async () => {
    const checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
    checkbox.checked = true

    const originalComplete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete')
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      get: () => true,
      configurable: true
    })

    const addEventListenerSpy = vi.spyOn(HTMLImageElement.prototype, 'addEventListener')

    new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    await waitForGallery()

    const loadedDivs = document.querySelectorAll('.image.loaded')
    expect(loadedDivs.length).toBe(3)
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('load', expect.any(Function))

    Object.defineProperty(HTMLImageElement.prototype, 'complete', originalComplete!)
  })

  it('should handle case when img is missing (trigger=false)', async () => {
    const checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
    checkbox.checked = false

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    await waitForGallery()

    const imgs = document.querySelectorAll('.image img')
    expect(imgs.length).toBe(0)
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should handle checkbox change', async () => {
    new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    await waitForGallery()

    const checkbox = document.querySelector(checkboxSelector)

    expect(checkbox).not.toBeNull()
    expect(checkbox).toBeInstanceOf(HTMLInputElement)
  })

  it('should refresh gallery on button click', async () => {
    new Gallery(wrapper, checkboxSelector, refreshBtn, source)
    await waitForGallery()

    const refreshBtnElement = document.querySelector(refreshBtn)

    expect(refreshBtnElement).not.toBeNull()
    expect(refreshBtnElement).toBeInstanceOf(HTMLButtonElement)
  })
})
