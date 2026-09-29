import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Preloader } from '../core/preloader'

class MockImage {
  decoding = ''
  src = ''
  constructor() {
    createdImages.push(this)
  }
}

let createdImages: MockImage[] = []

describe('Preloader', () => {
  beforeEach(() => {
    createdImages = []
    vi.stubGlobal('Image', MockImage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('preloads a URL by creating an Image with async decoding', () => {
    const preloader = new Preloader()
    preloader.preload('img1.jpg')

    expect(createdImages.length).toBe(1)
    expect(createdImages[0].src).toBe('img1.jpg')
    expect(createdImages[0].decoding).toBe('async')
  })

  it('ignores empty URL', () => {
    const preloader = new Preloader()
    preloader.preload('')

    expect(createdImages.length).toBe(0)
  })

  it('deduplicates repeated preload of the same URL', () => {
    const preloader = new Preloader()
    preloader.preload('img1.jpg')
    preloader.preload('img1.jpg')
    preloader.preload('img1.jpg')

    expect(createdImages.length).toBe(1)
  })

  it('preloads different URLs independently', () => {
    const preloader = new Preloader()
    preloader.preload('a.jpg')
    preloader.preload('b.jpg')

    expect(createdImages.map(i => i.src)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('preloadMany preloads each URL and deduplicates', () => {
    const preloader = new Preloader()
    preloader.preloadMany(['a.jpg', 'b.jpg', 'a.jpg', '', 'c.jpg'])

    expect(createdImages.map(i => i.src)).toEqual(['a.jpg', 'b.jpg', 'c.jpg'])
  })

  it('preloadAround skips the current index', () => {
    const preloader = new Preloader({ radius: 1 })
    preloader.preloadAround(['a.jpg', 'b.jpg', 'c.jpg'], 1)

    // Index 1 (b.jpg) — do not load; only a.jpg and c.jpg
    expect(createdImages.map(i => i.src).sort()).toEqual(['a.jpg', 'c.jpg'])
  })

  it('preloadAround does not go past the left boundary', () => {
    const preloader = new Preloader({ radius: 5 })
    preloader.preloadAround(['a.jpg', 'b.jpg', 'c.jpg'], 0)

    expect(createdImages.map(i => i.src).sort()).toEqual(['b.jpg', 'c.jpg'])
  })

  it('preloadAround does not go past the right boundary', () => {
    const preloader = new Preloader({ radius: 5 })
    preloader.preloadAround(['a.jpg', 'b.jpg', 'c.jpg'], 2)

    expect(createdImages.map(i => i.src).sort()).toEqual(['a.jpg', 'b.jpg'])
  })

  it('preloadAround uses default radius 2', () => {
    const preloader = new Preloader()
    preloader.preloadAround(
      ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'],
      2,
    )

    // Radius 2 around index 2 → 0, 1, 3, 4
    expect(createdImages.map(i => i.src).sort()).toEqual(
      ['a.jpg', 'b.jpg', 'd.jpg', 'e.jpg'],
    )
  })

  it('preloadAround respects a custom radius', () => {
    const preloader = new Preloader({ radius: 1 })
    preloader.preloadAround(
      ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'],
      2,
    )

    expect(createdImages.map(i => i.src).sort()).toEqual(['b.jpg', 'd.jpg'])
  })

  it('preloadAround deduplicates URLs across calls', () => {
    const preloader = new Preloader({ radius: 1 })
    preloader.preloadAround(['a.jpg', 'b.jpg', 'c.jpg'], 0)
    preloader.preloadAround(['a.jpg', 'b.jpg', 'c.jpg'], 1)

    // First call: b.jpg, c.jpg. Second: a.jpg (c.jpg was already included)
    expect(createdImages.map(i => i.src).sort()).toEqual(
      ['a.jpg', 'b.jpg', 'c.jpg'],
    )
  })

  it('has reports which URLs were preloaded', () => {
    const preloader = new Preloader()
    preloader.preload('a.jpg')

    expect(preloader.has('a.jpg')).toBe(true)
    expect(preloader.has('b.jpg')).toBe(false)
  })

  it('clear forgets preloaded history', () => {
    const preloader = new Preloader()
    preloader.preload('a.jpg')
    expect(preloader.has('a.jpg')).toBe(true)

    preloader.clear()
    expect(preloader.has('a.jpg')).toBe(false)

    // After `clear`, the same URL loads again
    preloader.preload('a.jpg')
    expect(createdImages.length).toBe(2)
  })
})
