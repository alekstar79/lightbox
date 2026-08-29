import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DirectionalHoverPlugin } from '../plugins/directional-hover'
import { Gallery } from '../components/gallery'
import { PluginContext } from '../core/plugin'

describe('DirectionalHoverPlugin', () => {
  let plugin: DirectionalHoverPlugin
  let container: HTMLElement
  let gallery: Gallery

  beforeEach(() => {
    container = document.createElement('div')
    container.className = 'gallery-container'
    document.body.appendChild(container)

    gallery = {
      galleryElement: container,
      render: vi.fn(),
      destroy: vi.fn(),
    } as unknown as Gallery

    plugin = new DirectionalHoverPlugin()
  })

  afterEach(() => {
    plugin.destroy()
    container.remove()
  })

  const mockRect = (el: HTMLElement, width = 200, height = 200, top = 100, left = 100) => {
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({
        width,
        height,
        top,
        left,
        bottom: top + height,
        right: left + width,
        x: left,
        y: top
      })
    })
  }

  const baseContext = (): PluginContext => ({
    gallery,
    lightbox: {} as any,
    renderer: {} as any,
    emitter: {} as any,
    root: document.body
  })

  it('should add placeholder and real-image class', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image">
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"  alt=""/>
        </div>
      </div>
    `

    plugin.apply(baseContext())

    const image = container.querySelector('.image') as HTMLElement
    expect(image.querySelector('.placeholder')).not.toBeNull()
    expect(image.querySelector('img')?.classList.contains('real-image')).toBe(true)
  })

  it('should add in-top class on mouseenter from top', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image">
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"  alt=""/>
        </div>
      </div>
    `
    plugin.apply(baseContext())

    const image = container.querySelector('.image') as HTMLElement
    mockRect(image, 200, 200, 100, 100)

    const event = new MouseEvent('mouseenter', {
      clientX: 200,
      clientY: 100,
    })

    image.dispatchEvent(event)

    expect(image.classList.contains('in-top')).toBe(true)
  })

  it('should add out-right class on mouseleave to right', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image">
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"  alt=""/>
        </div>
      </div>
    `
    plugin.apply(baseContext())

    const image = container.querySelector('.image') as HTMLElement
    mockRect(image, 200, 200, 100, 100)

    const event = new MouseEvent('mouseleave', {
      clientX: 300,
      clientY: 200,
    })

    image.dispatchEvent(event)

    expect(image.classList.contains('out-right')).toBe(true)
  })

  it('should clean up on destroy', () => {
    container.innerHTML = `
      <div class="gallery">
        <div class="image">
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"  alt=""/>
        </div>
      </div>
    `
    plugin.apply(baseContext())
    plugin.destroy()

    const image = container.querySelector('.image') as HTMLElement
    expect(image.querySelector('.placeholder')).toBeNull()
    expect(image.querySelector('img')?.classList.contains('real-image')).toBe(false)
  })
})
