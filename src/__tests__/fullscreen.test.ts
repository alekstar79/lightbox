import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Fullscreen } from '../core/fullscreen'

describe('Fullscreen', () => {
  let fullscreen: Fullscreen
  let mockRequestFullscreen: any
  let mockExitFullscreen: any

  const originalRequestFullscreen = Element.prototype.requestFullscreen
  const originalExitFullscreen = document.exitFullscreen
  const originalDocument = globalThis.document

  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(document, 'fullscreenEnabled', {
      value: true,
      configurable: true,
      writable: true,
    })

    mockRequestFullscreen = vi.fn().mockResolvedValue(undefined)
    mockExitFullscreen = vi.fn().mockResolvedValue(undefined)

    Element.prototype.requestFullscreen = mockRequestFullscreen
    document.exitFullscreen = mockExitFullscreen

    fullscreen = new Fullscreen()
  })

  afterEach(() => {
    Element.prototype.requestFullscreen = originalRequestFullscreen
    document.exitFullscreen = originalExitFullscreen
    vi.stubGlobal('document', originalDocument)
    vi.clearAllMocks()
  })

  it('should check if fullscreen is enabled', () => {
    expect(fullscreen.isEnabled).toBe(true)
  })

  it('should check if fullscreen is active', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: {},
      writable: true,
      configurable: true,
    })
    expect(fullscreen.isFullscreen).toBe(true)
  })

  it('should toggle fullscreen (enter)', async () => {
    const element = document.createElement('div')

    element.requestFullscreen = mockRequestFullscreen

    await fullscreen.toggle(element)

    expect(mockRequestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('should toggle fullscreen (exit)', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.createElement('div'),
      writable: true,
      configurable: true,
    })

    await fullscreen.toggle()

    expect(mockExitFullscreen).toHaveBeenCalledTimes(1)
  })

  it('should exit fullscreen', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.createElement('div'),
      writable: true,
      configurable: true,
    })

    await fullscreen.exit()

    expect(mockExitFullscreen).toHaveBeenCalledTimes(1)
  })

  it('should handle requestFullscreen without promise (legacy)', async () => {
    const element = document.createElement('div')
    const legacyRequest = vi.fn()

    element.requestFullscreen = legacyRequest

    const promise = fullscreen.request(element)

    expect(legacyRequest).toHaveBeenCalledTimes(1)

    let resolved = false
    promise.then(() => { resolved = true })

    document.dispatchEvent(new Event('fullscreenchange'))

    await promise
    expect(resolved).toBe(true)
  })

  it('should handle fullscreen change events', () => {
    const mockCallback = vi.fn()

    fullscreen.on('change', mockCallback)

    document.dispatchEvent(new Event('fullscreenchange'))

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should remove event listeners', () => {
    const mockCallback = vi.fn()

    fullscreen.on('change', mockCallback)
    fullscreen.off('change', mockCallback)

    document.dispatchEvent(new Event('fullscreenchange'))

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should return fallback methods when fullscreen is not supported', async () => {
    const newDoc = document.implementation.createHTMLDocument('test')

    delete (newDoc as any).exitFullscreen
    Object.defineProperty(newDoc, 'fullscreenEnabled', { value: false, configurable: true })

    delete (Element.prototype as any).requestFullscreen

    vi.stubGlobal('document', newDoc)

    const fallback = new Fullscreen()

    expect(fallback.isEnabled).toBe(false)
    expect(fallback.isFullscreen).toBe(false)
    expect(fallback.element).toBe(null)

    await expect(fallback.toggle()).resolves.toBeUndefined()
    await expect(fallback.request()).resolves.toBeUndefined()
    await expect(fallback.exit()).resolves.toBeUndefined()
    expect(() => fallback.on('change', vi.fn())).not.toThrow()
    expect(() => fallback.off('change', vi.fn())).not.toThrow()
  })
})
