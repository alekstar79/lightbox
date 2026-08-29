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

  public get galleryElement() {
    return this.galleryContainer
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

    this.source
      .map(a => ({ value: a, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.value)
      .forEach(({ src }) => {
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
