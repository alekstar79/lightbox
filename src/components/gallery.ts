import { emitter } from '../core/emitter'

export interface ImageSource {
  src: string;
}

export class Gallery {
  private container: HTMLElement
  private checkbox: HTMLInputElement
  private refreshBtn: HTMLElement
  private source: ImageSource[]

  constructor(containerSelector: string, checkboxSelector: string, refreshBtnSelector: string, source: ImageSource[]) {
    this.container = document.querySelector(containerSelector) as HTMLElement
    this.checkbox = document.querySelector(checkboxSelector) as HTMLInputElement
    this.refreshBtn = document.querySelector(refreshBtnSelector) as HTMLElement
    this.source = source

    this.checkbox.addEventListener('change', () => this.render())
    this.refreshBtn.addEventListener('click', () => this.render())

    this.render().catch(console.error)
    emitter.emit('window:loaded')
  }

  private async createList(trigger: boolean): Promise<HTMLElement[]> {
    const div = document.createElement('div')
    const flow: HTMLElement[] = []

    div.classList.add('gallery', 'grid')

    this.source
      .map(a => ({ value: a, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.value)
      .forEach(({ src }) => {
        const item = document.createElement('div')

        if (trigger) {
          item.classList.add('image', 'content', 'flow')
          item.style.backgroundImage = `url(images/thumb/${src})`
          item.innerHTML = `<img src="images/${src}" loading="lazy" alt="" />`
          flow.push(item)
        } else {
          item.classList.add('image')
          item.innerHTML = `<a href="javascript:void(0)">${src}</a>`
        }

        div.appendChild(item)
      })

    this.container.innerHTML = ''
    this.container.appendChild(div)

    emitter.emit('list:created')

    return flow
  }

  private loadImages(flow: HTMLElement[]): void {
    flow.forEach(div => {
      const img = div.querySelector('img')

      if (img) {
        const loaded = () => div.classList.add('loaded')

        if (!img.complete) {
          img.addEventListener('load', loaded)
        } else {
          loaded()
        }
      }
    })
  }

  public async render(): Promise<void> {
    const flow = await this.createList(this.checkbox.checked)
    this.loadImages(flow)
  }
}
