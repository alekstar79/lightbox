import { emitter } from '../core/emitter'

export interface ImageSource {
  src: string;
}

export interface GalleryOptions {
  container: HTMLElement;
  source: ImageSource[];
  setupFn?: (gallery: Gallery) => void;
  classMap?: string;
}

export class Gallery {
  private readonly galleryContainer: HTMLElement
  private readonly container: HTMLElement
  private readonly source: ImageSource[]
  private renderedOrder: number[] = []

  public get galleryElement(): HTMLElement {
    return this.galleryContainer
  }

  public get renderedOrderIndices(): readonly number[] {
    return this.renderedOrder
  }

  constructor({ container, source, setupFn }: GalleryOptions) {
    this.container = container
    this.source = source

    this.galleryContainer = document.createElement('div')
    this.galleryContainer.className = 'gallery-container'
    this.container.appendChild(this.galleryContainer)

    if (typeof setupFn === 'function') {
      setupFn(this)
    }

    this.render()
    emitter.emit('window:loaded')
  }

  private createList(): HTMLElement[] {
    const div = document.createElement('div')
    const flow: HTMLElement[] = []

    div.classList.add('gallery', 'grid')

    const shuffled = this.source
      .map((value, index) => ({ value, index, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)

    this.renderedOrder = shuffled.map(item => item.index)

    shuffled.forEach(({ value: { src } }) => {
      const item = document.createElement('div')

      item.classList.add('image', 'content', 'flow')
      item.innerHTML = `<img src="${src}" alt="" />`

      flow.push(item)
      div.appendChild(item)
    })

    this.galleryContainer.innerHTML = ''
    this.galleryContainer.appendChild(div)

    emitter.emit('list:created')

    return flow
  }

  private loadImages(flow: HTMLElement[]): void {
    flow.forEach(container => {
      const img = container.querySelector('img')
      if (!img) return

      const loadHandler = () => container.classList.add('loaded')

      if (img.complete) {
        loadHandler()
      } else {
        img.addEventListener('load', loadHandler, { once: true })
      }
    })
  }

  public render(): void {
    this.loadImages(this.createList())
  }

  public destroy(): void {
    this.galleryContainer.remove()
  }
}
