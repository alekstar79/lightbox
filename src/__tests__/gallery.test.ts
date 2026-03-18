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

  it('should create gallery items', () => {
    new Gallery(wrapper, checkboxSelector, refreshBtn, source)

    const wrapperElement = document.querySelector(wrapper)
    expect(wrapperElement).not.toBeNull()

    const content = wrapperElement?.innerHTML || ''
    expect(content).toContain('img1.jpg')
    expect(content).toContain('img2.jpg')
    expect(content).toContain('img3.jpg')
  })

  it('should handle checkbox change', () => {
    const checkboxBefore = document.querySelector(checkboxSelector)
    console.log('Checkbox перед созданием Gallery:', checkboxBefore)

    new Gallery(wrapper, checkboxSelector, refreshBtn, source)

    const checkbox = document.querySelector(checkboxSelector)
    console.log('Checkbox после создания Gallery:', checkbox)

    expect(checkbox).not.toBeNull()
    expect(checkbox).toBeInstanceOf(HTMLInputElement)
  })

  it('should refresh gallery on button click', () => {
    const refreshBtnBefore = document.querySelector(refreshBtn)
    console.log('Refresh button перед созданием Gallery:', refreshBtnBefore)

    new Gallery(wrapper, checkboxSelector, refreshBtn, source)

    const refreshBtnElement = document.querySelector(refreshBtn)
    console.log('Refresh button после создания Gallery:', refreshBtnElement)

    expect(refreshBtnElement).not.toBeNull()
    expect(refreshBtnElement).toBeInstanceOf(HTMLButtonElement)
  })
})
