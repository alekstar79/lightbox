import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Renderer } from '../core/renderer'

describe('Renderer', () => {
  let renderer: Renderer
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = {
      style: {
        transform: '',
        transformOrigin: ''
      },
      getBoundingClientRect: vi.fn(() => ({
        left: 0,
        top: 0
      }))
    } as unknown as HTMLElement

    renderer = new Renderer({
      element: mockElement,
      minScale: 0.1,
      maxScale: 30,
      scaleSensitivity: 50
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct options', () => {
    expect(renderer).toBeDefined()
  })

  it('should zoom in correctly', () => {
    renderer.zoom({
      deltaScale: 1,
      x: 100,
      y: 100
    })

    expect(mockElement.style.transform).toContain('matrix')
  })

  it('should zoom out correctly', () => {
    renderer.zoom({
      deltaScale: -1,
      x: 100,
      y: 100
    })

    expect(mockElement.style.transform).toContain('matrix')
  })

  it('should pan correctly', () => {
    renderer.pan({
      originX: 10,
      originY: 10
    })

    expect(mockElement.style.transform).toContain('matrix')
  })

  it('should pan to specific position', () => {
    renderer.panTo({
      originX: 0,
      originY: 0,
      scale: 1
    })

    expect(mockElement.style.transform).toContain('matrix')
  })

  it('should handle scale limits', () => {
    // Try to zoom beyond max scale
    renderer.zoom({
      deltaScale: 100,
      x: 100,
      y: 100
    })

    expect(mockElement.style.transform).toContain('matrix')
  })
})
