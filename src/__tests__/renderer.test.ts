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
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100
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

  it('should pan by delta', () => {
    renderer.panBy({
      originX: 5,
      originY: 5
    })

    expect(mockElement.style.transform).toContain('matrix')
  })

  it('should not exceed max scale', () => {
    renderer.zoom({ deltaScale: 1000, x: 0, y: 0 })
    renderer.zoom({ deltaScale: 1000, x: 0, y: 0 })
    const transformAfterSecond = mockElement.style.transform

    renderer.zoom({ deltaScale: 1000, x: 0, y: 0 })
    const transformAfterThird = mockElement.style.transform

    expect(transformAfterThird).toBe(transformAfterSecond)
  })

  it('should not go below min scale', () => {
    renderer.zoom({ deltaScale: -1000, x: 0, y: 0 })
    const transformAfterFirst = mockElement.style.transform
    renderer.zoom({ deltaScale: -1000, x: 0, y: 0 })
    const transformAfterSecond = mockElement.style.transform
    expect(transformAfterSecond).toBe(transformAfterFirst)
  })

  it('should handle scale limits', () => {
    renderer.zoom({
      deltaScale: 100,
      x: 100,
      y: 100
    })

    expect(mockElement.style.transform).toContain('matrix')
  })
})
