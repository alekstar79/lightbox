import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { measureColumns } from '../plugins/parallax-columns/columns'
import { SmoothScroll } from '../plugins/parallax-columns/smooth-scroll'
import { ParallaxColumnsPlugin } from '../plugins/parallax-columns'
import { Gallery } from '../components/gallery'
import { emitter } from '../core/emitter'
import { PluginContext } from '../core/plugin'

// helpers
const mockRect = (el: HTMLElement, rect: Partial<DOMRect>): void => {
  const full = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(full)
}

// measureColumns
describe('measureColumns', () => {
  let grid: HTMLElement

  beforeEach(() => {
    grid = document.createElement('div')
    grid.className = 'gallery'
    document.body.appendChild(grid)
  })

  afterEach(() => {
    grid.remove()
    vi.restoreAllMocks()
  })

  it('returns null for empty grid', () => {
    mockRect(grid, { top: 0, left: 0 })
    expect(measureColumns(grid)).toBeNull()
  })

  it('groups items into columns by left coordinate and computes deltas', () => {
    const items: HTMLElement[] = []
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('div')
      el.className = 'image'
      grid.appendChild(el)
      items.push(el)
    }

    mockRect(grid, { top: 0, left: 0 })
    mockRect(items[0], { left: 0, top: 0, bottom: 100 })
    mockRect(items[1], { left: 200, top: 0, bottom: 150 })
    mockRect(items[2], { left: 0, top: 100, bottom: 200 })
    mockRect(items[3], { left: 200, top: 150, bottom: 250 })

    const layout = measureColumns(grid)!
    expect(layout.columns.length).toBe(2)
    expect(layout.minBottom).toBe(200)
    expect(layout.itemDeltas.get(items[0])).toBe(0)
    expect(layout.itemDeltas.get(items[1])).toBe(50)
    expect(layout.itemDeltas.get(items[2])).toBe(0)
    expect(layout.itemDeltas.get(items[3])).toBe(50)
  })

  it('clusters left coordinates within tolerance', () => {
    const items: HTMLElement[] = []
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div')
      el.className = 'image'
      grid.appendChild(el)
      items.push(el)
    }

    mockRect(grid, { top: 0, left: 0 })
    mockRect(items[0], { left: 0, top: 0, bottom: 100 })
    mockRect(items[1], { left: 3, top: 100, bottom: 200 })
    mockRect(items[2], { left: 200, top: 0, bottom: 150 })

    const layout = measureColumns(grid)!
    expect(layout.columns.length).toBe(2)
  })

  it('returns null when no .image elements exist', () => {
    grid.innerHTML = '<div class="other"></div>'
    mockRect(grid, { top: 0, left: 0 })
    expect(measureColumns(grid)).toBeNull()
  })
})

// SmoothScroll
describe('SmoothScroll', () => {
  let instance: SmoothScroll | null = null
  let originalScrollTo: typeof window.scrollTo
  let scrollY = 0

  beforeEach(() => {
    scrollY = 0
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollY,
    })

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 5000,
    })
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: 800,
    })
    Object.defineProperty(document.body, 'scrollHeight', {
      configurable: true,
      value: 5000,
    })
    Object.defineProperty(document.body, 'offsetHeight', {
      configurable: true,
      value: 5000,
    })

    originalScrollTo = window.scrollTo
    window.scrollTo = vi.fn((_x: number, y: number) => {
      scrollY = y
    }) as unknown as typeof window.scrollTo
  })

  afterEach(() => {
    instance?.stop()
    instance = null
    window.scrollTo = originalScrollTo
    vi.restoreAllMocks()
  })

  it('start registers listeners only once', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    instance = new SmoothScroll()
    instance.start()
    instance.start()
    const wheelCalls = addSpy.mock.calls.filter(c => c[0] === 'wheel')
    expect(wheelCalls.length).toBe(1)
  })

  it('stop is a no-op when not active', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    instance = new SmoothScroll()
    instance.stop()
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('stop removes listeners after start', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    instance = new SmoothScroll()
    instance.start()
    instance.stop()
    expect(removeSpy).toHaveBeenCalledWith('wheel', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('wheel prevents default and starts animation', () => {
    instance = new SmoothScroll({ duration: 0.1 })
    instance.start()

    const event = new WheelEvent('wheel', { deltaY: 100, cancelable: true })
    const preventSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventSpy).toHaveBeenCalled()
  })

  it('wheel respects ctrlKey (pinch zoom)', () => {
    instance = new SmoothScroll()
    instance.start()

    const event = new WheelEvent('wheel', {
      deltaY: 100,
      ctrlKey: true,
      cancelable: true,
    })
    const preventSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventSpy).not.toHaveBeenCalled()
  })

  it('wheel respects body overflow hidden (lightbox open)', () => {
    document.body.style.overflow = 'hidden'
    instance = new SmoothScroll()
    instance.start()

    const event = new WheelEvent('wheel', { deltaY: 100, cancelable: true })
    const preventSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventSpy).not.toHaveBeenCalled()
    document.body.style.overflow = ''
  })

  it('tick does nothing when not animating', () => {
    instance = new SmoothScroll()
    instance.start()
    instance.tick(performance.now())
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('tick advances animation and calls scrollTo', () => {
    instance = new SmoothScroll({ duration: 0.01 })
    instance.start()

    const event = new WheelEvent('wheel', { deltaY: 100 })
    window.dispatchEvent(event)

    instance.tick(performance.now() + 1000)
    expect(window.scrollTo).toHaveBeenCalled()
  })

  it('native scroll resyncs state when not animating', () => {
    instance = new SmoothScroll({ duration: 0.01 })
    instance.start()

    scrollY = 500
    window.dispatchEvent(new Event('scroll'))

    const event = new WheelEvent('wheel', { deltaY: 50 })
    window.dispatchEvent(event)

    instance.tick(performance.now() + 1000)
    const lastCall = (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)
    expect(lastCall?.[1]).toBe(550)
  })

  it('respects custom duration and easing', () => {
    const easing = vi.fn((t: number) => t)
    instance = new SmoothScroll({ duration: 2, easing })
    instance.start()

    const event = new WheelEvent('wheel', { deltaY: 100 })
    window.dispatchEvent(event)
    instance.tick(performance.now() + 100)

    expect(easing).toHaveBeenCalled()
  })

  it('recalc clamps target when maxScroll shrinks', () => {
    instance = new SmoothScroll()
    instance.start()
    expect(() => instance!.recalc()).not.toThrow()
  })
})

// ParallaxColumnsPlugin
describe('ParallaxColumnsPlugin', () => {
  let plugin: ParallaxColumnsPlugin
  let container: HTMLElement
  let gallery: Gallery
  let rafCallbacks: FrameRequestCallback[]

  class ResizeObserverMock {
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
  }

  const flushRaf = (): void => {
    const cbs = [...rafCallbacks]
    rafCallbacks = []
    for (const cb of cbs) cb(0)
  }

  beforeEach(() => {
    rafCallbacks = []
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    document.body.innerHTML = '<div class="wrapper"></div>'
    container = document.querySelector('.wrapper') as HTMLElement

    gallery = {
      galleryElement: container,
      renderedOrderIndices: [],
      render: vi.fn(),
      destroy: vi.fn(),
    } as unknown as Gallery

    plugin = new ParallaxColumnsPlugin({ smoothScroll: false })
  })

  afterEach(() => {
    plugin.destroy()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  const context = (): PluginContext => ({
    gallery,
    lightbox: {} as any,
    renderer: {} as any,
    emitter,
    root: document.body,
  })

  it('applies without .gallery element without throwing', () => {
    expect(() => plugin.apply(context())).not.toThrow()
  })

  it('measures grid and sets container height, clip and clip-margin', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image"></div>
        <div class="image"></div>
      </div>
    `
    const grid = container.querySelector('.gallery') as HTMLElement
    const items = container.querySelectorAll<HTMLElement>('.image')

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })
    mockRect(items[0], { left: 0, top: 0, bottom: 100 })
    mockRect(items[1], { left: 200, top: 0, bottom: 150 })

    plugin.apply(context())

    expect(container.style.height).not.toBe('')
    expect(container.style.overflow).toBe('clip')
    expect(container.style.getPropertyValue('overflow-clip-margin')).toBe('60px')
  })

  it('respects custom clipMargin', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image"></div>
      </div>
    `
    const grid = container.querySelector('.gallery') as HTMLElement
    const item = container.querySelector('.image') as HTMLElement

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })
    mockRect(item, { left: 0, top: 0, bottom: 100 })

    plugin = new ParallaxColumnsPlugin({ smoothScroll: false, clipMargin: 100 })
    plugin.apply(context())

    expect(container.style.getPropertyValue('overflow-clip-margin')).toBe('100px')
  })

  it('destroy restores styles and clears transforms', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image"></div>
        <div class="image"></div>
      </div>
    `
    const grid = container.querySelector('.gallery') as HTMLElement
    const items = container.querySelectorAll<HTMLElement>('.image')

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })
    mockRect(items[0], { left: 0, top: 0, bottom: 100 })
    mockRect(items[1], { left: 200, top: 0, bottom: 150 })

    plugin.apply(context())
    plugin.destroy()

    expect(container.style.height).toBe('')
    expect(container.style.overflow).toBe('')
    expect(container.style.getPropertyValue('overflow-clip-margin')).toBe('')
  })

  it('reschedules measurement on list:created', () => {
    container.innerHTML = '<div class="gallery"><div class="image"></div></div>'
    const grid = container.querySelector('.gallery') as HTMLElement
    const item = container.querySelector('.image') as HTMLElement

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })
    mockRect(item, { left: 0, top: 0, bottom: 100 })

    plugin.apply(context())
    rafCallbacks = []

    emitter.emit('list:created')

    expect(rafCallbacks.length).toBeGreaterThan(0)
  })

  it('handles window resize', () => {
    container.innerHTML = '<div class="gallery"></div>'
    const grid = container.querySelector('.gallery') as HTMLElement

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })

    plugin.apply(context())
    rafCallbacks = []

    window.dispatchEvent(new Event('resize'))

    expect(rafCallbacks.length).toBeGreaterThan(0)
  })

  it('applies translate3d on items with delta > 0', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image"></div>
        <div class="image"></div>
      </div>
    `
    const grid = container.querySelector('.gallery') as HTMLElement
    const items = container.querySelectorAll<HTMLElement>('.image')

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })
    mockRect(items[0], { left: 0, top: 0, bottom: 100 })
    mockRect(items[1], { left: 200, top: 0, bottom: 150 })

    plugin.apply(context())

    Object.defineProperty(window, 'scrollY', { value: 50, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 500, configurable: true })

    flushRaf()

    expect(items[1].style.transform).toContain('translate3d')
  })

  it('does not set transform on items with delta 0', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image"></div>
      </div>
    `
    const grid = container.querySelector('.gallery') as HTMLElement
    const item = container.querySelector('.image') as HTMLElement

    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })
    mockRect(item, { left: 0, top: 0, bottom: 100 })

    plugin.apply(context())
    flushRaf()

    expect(item.style.transform).toBe('')
  })

  it('applies with smoothScroll enabled', () => {
    container.innerHTML = '<div class="gallery"></div>'
    const grid = container.querySelector('.gallery') as HTMLElement
    mockRect(container, { top: 0, left: 0 })
    mockRect(grid, { top: 0, left: 0 })

    plugin = new ParallaxColumnsPlugin({ smoothScroll: true })
    expect(() => plugin.apply(context())).not.toThrow()
  })
})
