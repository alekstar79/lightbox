import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fullscreen } from '../core/fullscreen'

describe('Fullscreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true })
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, writable: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should check if fullscreen is enabled', () => {
    expect(fullscreen.isEnabled).toBe(true)
  })

  it('should check if fullscreen is active', () => {
    const mockElement = {}
    Object.defineProperty(document, 'fullscreenElement', { value: mockElement, writable: true })
    expect(fullscreen.isFullscreen).toBe(true)
  })

  it('should toggle fullscreen', async () => {
    const mockElement = {
      requestFullscreen: vi.fn()
    } as any

    Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true })

    await fullscreen.toggle(mockElement)

    expect(mockElement.requestFullscreen).toHaveBeenCalled()
  })

  it('should exit fullscreen', async () => {
    const mockExit = vi.fn()
    Object.defineProperty(document, 'exitFullscreen', { value: mockExit, writable: true })

    await fullscreen.exit()

    expect(mockExit).toHaveBeenCalled()
  })

  it('should handle fullscreen change events', () => {
    const mockCallback = vi.fn()
    fullscreen.on('change', mockCallback)
    document.dispatchEvent(new Event('fullscreenchange'))

    expect(mockCallback).toHaveBeenCalled()
  })

  it('should remove event listeners', () => {
    const mockCallback = vi.fn()
    fullscreen.on('change', mockCallback)
    fullscreen.off('change', mockCallback)
    document.dispatchEvent(new Event('fullscreenchange'))

    expect(mockCallback).not.toHaveBeenCalled()
  })
})
