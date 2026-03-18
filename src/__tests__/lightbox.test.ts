import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Lightbox } from '../components/lightbox'
import { fullscreen } from '../core/fullscreen'

// Мокируем модуль fullscreen
vi.mock('../core/fullscreen', () => ({
  fullscreen: {
    isEnabled: true,
    isFullscreen: false,
    element: null,
    toggle: vi.fn().mockImplementation(async () => {
      // Инвертируем состояние isFullscreen при каждом вызове toggle
      const mock = vi.mocked(fullscreen)
      mock.isFullscreen = !mock.isFullscreen
    }),
    exit: vi.fn().mockImplementation(async () => {
      vi.mocked(fullscreen).isFullscreen = false
    }),
    on: vi.fn(),
    off: vi.fn()
  }
}))

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

  beforeEach(() => {
    // Устанавливаем HTML-структуру перед каждым тестом
    document.body.innerHTML = lightboxHTML
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks()
    // Инициализируем Lightbox
    lightbox = Lightbox.init()
  })

  afterEach(() => {
    // Очищаем DOM после каждого теста
    document.body.innerHTML = ''
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

  it('should navigate to the next image', () => {
    lightbox.open(0, ['img1.jpg', 'img2.jpg'])

    const nextBtn = document.querySelector('.next') as HTMLElement
    nextBtn.click()

    const currentImg = document.querySelector('.current-img') as HTMLElement
    expect(currentImg.textContent).toBe('2')
  })

  it('should close the lightbox', () => {
    lightbox.open(0, ['img1.jpg'])

    const closeIcon = document.querySelector('.fa-times') as HTMLElement
    closeIcon.click()

    const previewBox = document.querySelector('.preview-box') as HTMLElement
    expect(previewBox.classList.contains('show')).toBe(false)
  })

  it('should call fullscreen.toggle when expand icon is clicked', async () => {
    lightbox.open(0, ['img1.jpg'])

    const expandIcon = document.querySelector('.fa-expand') as HTMLElement
    await expandIcon.click()

    expect(fullscreen.toggle).toHaveBeenCalledTimes(1)
  })

  it('should exit fullscreen when closing the lightbox if it was in fullscreen mode', async () => {
    lightbox.open(0, ['img1.jpg'])

    // Входим в полноэкранный режим
    const expandIcon = document.querySelector('.fa-expand') as HTMLElement
    await expandIcon.click()
    expect(vi.mocked(fullscreen).isFullscreen).toBe(true)

    // Закрываем лайтбокс
    const closeIcon = document.querySelector('.fa-times') as HTMLElement
    await closeIcon.click()

    expect(fullscreen.exit).toHaveBeenCalledTimes(1)
  })
})
