import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Lightbox, LightboxDependencies } from '../components/lightbox'
import { Fullscreen, FullscreenState } from '../core/fullscreen'
import { Bindings } from '../core/bindings'

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
  let deps: LightboxDependencies

  beforeEach(() => {
    document.body.innerHTML = lightboxHTML
    mockBindings = new Bindings()
    vi.spyOn(mockBindings, 'bind')
    vi.spyOn(mockBindings, 'track')

    deps = {
      root: document.querySelector('.preview-box') as HTMLElement,
      shadow: document.querySelector('.shadow') as HTMLElement,
      imageBox: document.querySelector('.image-box') as HTMLElement,
      image: document.querySelector('.preview-box img') as HTMLImageElement,
      currentCounter: document.querySelector('.current-img') as HTMLElement,
      totalCounter: document.querySelector('.total-img') as HTMLElement,
      expandBtn: document.querySelector('.fa-expand') as HTMLElement,
      closeBtn: document.querySelector('.fa-times') as HTMLElement,
      prevBtn: document.querySelector('.prev') as HTMLElement,
      nextBtn: document.querySelector('.next') as HTMLElement,
    }

    vi.spyOn(Fullscreen, 'init').mockImplementation(() => {})
    vi.spyOn(Fullscreen, 'on').mockImplementation(() => () => {})
    vi.spyOn(Fullscreen, 'off').mockImplementation(() => {})
    vi.spyOn(Fullscreen, 'toggle').mockImplementation(async () => FullscreenState.ON)
    vi.spyOn(Fullscreen, 'exit').mockImplementation(async () => FullscreenState.OFF)
    vi.spyOn(Fullscreen, 'state', 'get').mockReturnValue(FullscreenState.OFF)

    lightbox = new Lightbox({ deps, keyboard: mockBindings })
  })

  afterEach(() => {
    lightbox.destroy()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
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

  it('should call fullscreen.toggle when expand icon is clicked', async () => {
    lightbox.open(0, ['img1.jpg'])

    const expandIcon = document.querySelector('.fa-expand') as HTMLElement
    expandIcon.click()
    await Promise.resolve()

    expect(Fullscreen.toggle).toHaveBeenCalledTimes(1)
  })

  it('should call keyboard bindings on init', () => {
    expect(mockBindings.bind).toHaveBeenCalledTimes(1)
    expect(mockBindings.track).toHaveBeenCalledTimes(1)
  })
})
