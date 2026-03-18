import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Lightbox } from '../components/lightbox'
import { fullscreen } from '../core/fullscreen'
import { Bindings } from '../core/bindings'

let changeCallback: () => void = () => {}
let mockIsFullscreen = false

vi.mock('../core/fullscreen', () => ({
  fullscreen: {
    isEnabled: true,
    get isFullscreen() {
      return mockIsFullscreen
    },
    element: null,
    toggle: vi.fn().mockImplementation(async () => {
      mockIsFullscreen = !mockIsFullscreen
      changeCallback()
    }),
    exit: vi.fn().mockImplementation(async () => {
      if (mockIsFullscreen) {
        mockIsFullscreen = false
        changeCallback()
      }
    }),
    on: vi.fn((event, callback) => {
      if (event === 'change') {
        changeCallback = callback
      }
    }),
    off: vi.fn()
  }
}))

vi.mock('../core/bindings')

const lightboxHTML = `
  <div class="preview-box">
    <div class="details">
      <span class="title"><p class="current-img"></p> / <p class="total-img"></p></span>
      <div class="actions">
        <span class="icon fas fa-expand"></span>
        <span class="icon fas fa-times"></span>
      </div>
    </div>
    <div class="image-box">
      <img src="" alt="">
      <div class="pan-overlay"></div>
      <div class="slide prev"></div>
      <div class="slide next"></div>
    </div>
  </div>
  <div class="shadow"></div>
`

describe('Lightbox', () => {
  let lightbox: Lightbox
  let mockBindings: Bindings

  beforeEach(() => {
    document.body.innerHTML = lightboxHTML
    mockBindings = new Bindings()
    lightbox = Lightbox.init(mockBindings)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    ;(Lightbox as any).instance = undefined
    vi.clearAllMocks()
    mockIsFullscreen = false
  })

  it('should open the lightbox with correct image and counter', () => {
    const imageList = ['img1.jpg', 'img2.jpg', 'img3.jpg']
    lightbox.open(1, imageList)

    const previewBox = document.querySelector('.preview-box') as HTMLElement
    const currentImg = document.querySelector('.current-img') as HTMLElement
    const totalImg = document.querySelector('.total-img') as HTMLElement
    const previewImg = document.querySelector('.preview-box img') as HTMLImageElement

    expect(previewBox.classList.contains('show')).toBe(true)
    expect(currentImg.textContent).toBe('2')
    expect(totalImg.textContent).toBe('3')
    expect(previewImg.src).toContain('img2.jpg')
  })

  it('should navigate to the next image on button click', () => {
    lightbox.open(0, ['img1.jpg', 'img2.jpg'])

    const nextBtn = document.querySelector('.next') as HTMLElement
    nextBtn.click()

    const currentImg = document.querySelector('.current-img') as HTMLElement
    expect(currentImg.textContent).toBe('2')
  })

  it('should navigate to the previous image on button click', () => {
    lightbox.open(1, ['img1.jpg', 'img2.jpg'])

    const prevBtn = document.querySelector('.prev') as HTMLElement
    prevBtn.click()

    const currentImg = document.querySelector('.current-img') as HTMLElement
    expect(currentImg.textContent).toBe('1')
  })

  it('should close the lightbox on icon click', () => {
    lightbox.open(0, ['img1.jpg'])

    const closeIcon = document.querySelector('.fa-times') as HTMLElement
    closeIcon.click()

    const previewBox = document.querySelector('.preview-box') as HTMLElement
    expect(previewBox.classList.contains('show')).toBe(false)
  })

  it('should close the lightbox on shadow click', () => {
    lightbox.open(0, ['img1.jpg'])

    const shadow = document.querySelector('.shadow') as HTMLElement
    shadow.click()

    const previewBox = document.querySelector('.preview-box') as HTMLElement
    expect(previewBox.classList.contains('show')).toBe(false)
  })

  it('should call fullscreen.toggle when expand icon is clicked', () => {
    lightbox.open(0, ['img1.jpg'])

    const expandIcon = document.querySelector('.fa-expand') as HTMLElement
    expandIcon.click()

    expect(fullscreen.toggle).toHaveBeenCalledTimes(1)
  })

  it('should exit fullscreen when closing the lightbox if it was in fullscreen mode', () => {
    lightbox.open(0, ['img1.jpg'])

    const expandIcon = document.querySelector('.fa-expand') as HTMLElement
    expandIcon.click()
    expect(fullscreen.isFullscreen).toBe(true)

    const closeIcon = document.querySelector('.fa-times') as HTMLElement
    closeIcon.click()

    expect(fullscreen.exit).toHaveBeenCalledTimes(1)
    expect(fullscreen.isFullscreen).toBe(false)
  })

  it('should call keyboard bindings on init', () => {
    expect(mockBindings.bind).toHaveBeenCalledTimes(1)
    expect(mockBindings.track).toHaveBeenCalledTimes(1)
  })

  it('should not navigate beyond the last image', () => {
    lightbox.open(1, ['img1.jpg', 'img2.jpg'])
    const nextBtn = document.querySelector('.next') as HTMLElement
    nextBtn.click()
    const currentImg = document.querySelector('.current-img') as HTMLElement
    expect(currentImg.textContent).toBe('2')
  })

  it('should not navigate before the first image', () => {
    lightbox.open(0, ['img1.jpg', 'img2.jpg'])
    const prevBtn = document.querySelector('.prev') as HTMLElement
    prevBtn.click()
    const currentImg = document.querySelector('.current-img') as HTMLElement
    expect(currentImg.textContent).toBe('1')
  })

  it('should not initialize keyboard bindings if not provided', () => {
    vi.clearAllMocks()

    ;(Lightbox as any).instance = undefined
    Lightbox.init()

    expect(mockBindings.bind).not.toHaveBeenCalled()
    expect(mockBindings.track).not.toHaveBeenCalled()
  })
})
