import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Fullscreen, FullscreenState, FullscreenErrorCode } from '../core/fullscreen'

const originalRequestFullscreen = Element.prototype.requestFullscreen
const originalExitFullscreen = document.exitFullscreen

describe('Fullscreen', () => {
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

    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined)

    Fullscreen.init()
  })

  afterEach(() => {
    Element.prototype.requestFullscreen = originalRequestFullscreen
    document.exitFullscreen = originalExitFullscreen
    Fullscreen.destroy()
  })

  it('should check if fullscreen is enabled', () => {
    expect(Fullscreen.isEnabled).toBe(true)
  })

  it('should check if fullscreen is active', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: {},
      writable: true,
      configurable: true,
    })
    expect(Fullscreen.state).toBe(FullscreenState.ON)
  })

  it('should toggle fullscreen (enter)', async () => {
    const element = document.createElement('div')
    const spy = vi.spyOn(Fullscreen, 'enter').mockResolvedValue(FullscreenState.ON)
    await Fullscreen.toggle(element)
    expect(spy).toHaveBeenCalledWith(element, undefined)
    spy.mockRestore()
  })

  it('should toggle fullscreen (exit)', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.createElement('div'),
      writable: true,
      configurable: true,
    })
    const spy = vi.spyOn(Fullscreen, 'exit').mockResolvedValue(FullscreenState.OFF)
    await Fullscreen.toggle()
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('should handle fullscreen change events', () => {
    const mockCallback = vi.fn()
    Fullscreen.on('change', mockCallback)
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.any(String)
    }))
  })

  it('should remove event listeners', () => {
    const mockCallback = vi.fn()
    const unsubscribe = Fullscreen.on('change', mockCallback)
    unsubscribe()
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should return fallback methods when fullscreen is not supported', async () => {
    const newDoc = document.implementation.createHTMLDocument('test')
    delete (newDoc as any).exitFullscreen
    Object.defineProperty(newDoc, 'fullscreenEnabled', { value: false, configurable: true })
    delete (Element.prototype as any).requestFullscreen

    vi.stubGlobal('document', newDoc)
    Fullscreen.destroy()
    Fullscreen.init()

    expect(Fullscreen.isSupported).toBe(false)
    expect(Fullscreen.state).toBe(FullscreenState.UNSUPPORTED)

    await expect(Fullscreen.toggle()).rejects.toThrow('Fullscreen API not supported')
    await expect(Fullscreen.exit()).resolves.toBe(FullscreenState.OFF)

    vi.unstubAllGlobals()
  })

  it('should throw iOS_VIDEO_ONLY when trying to enter fullscreen on non-video element on iOS', async () => {
    const originalIsIOS = (Fullscreen as any).isIOS
    ;(Fullscreen as any).isIOS = true

    const div = document.createElement('div')
    await expect(Fullscreen.enter(div)).rejects.toMatchObject({
      code: FullscreenErrorCode.IOS_VIDEO_ONLY,
    })

    ;(Fullscreen as any).isIOS = originalIsIOS
  })

  it('should reject on request error', async () => {
    Element.prototype.requestFullscreen = vi.fn().mockImplementation(() => {
      throw new Error('request failed')
    })

    Fullscreen.destroy()
    Fullscreen.init()

    const div = document.createElement('div')
    await expect(Fullscreen.enter(div)).rejects.toThrow('request failed')
  })
})
