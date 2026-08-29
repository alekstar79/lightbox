import { Plugin, PluginContext } from '../../core/plugin'

const directionsMap: Record<number, string> = { 0: 'top', 1: 'right', 2: 'bottom', 3: 'left' }
const directions = Object.values(directionsMap)
const classNames = ['in', 'out']
  .map(p => directions.map(d => `${p}-${d}`))
  .flat()

const placeholderSvg = `
  <svg viewBox="0 0 80 76" style="width:50px;height:50px;">
    <path d="M68.97 24.86L60.46 2.3C59.96 0.7 58.16 -0.26 56.53 0.38L1.98 20.22C0.38 20.7 -0.42 22.62 0.22 24.22L8.86 47.78V35.15C8.86 29.5 13.34 24.86 18.89 24.86H32.94L50.63 12.86L60.78 24.86H68.97ZM77.1 32.06H18.89C17.25 32.06 16.06 33.45 16.06 35.15V72.85C16.06 74.55 17.25 75.94 18.89 75.94H77.1C78.74 75.94 79.94 74.55 79.94 72.85V35.15C79.94 33.45 78.74 32.06 77.1 32.06Z" fill="#ccc"/>
  </svg>
`

export class DirectionalHoverPlugin implements Plugin {
  name = 'directional-hover'
  private items: HTMLElement[] = []

  apply(context: PluginContext): void {
    const galleryEl = context.gallery.galleryElement
    this.items = Array.from(galleryEl.querySelectorAll('.image'))

    this.items.forEach((item) => {
      if (!item.querySelector('.placeholder')) {
        const placeholder = document.createElement('div')
        placeholder.className = 'placeholder'
        placeholder.innerHTML = placeholderSvg
        item.appendChild(placeholder)
      }

      const img = item.querySelector('img')
      if (img) {
        img.classList.add('real-image')
      }

      item.addEventListener('mouseenter', this.handleEnter)
      item.addEventListener('mouseleave', this.handleLeave)
    })
  }

  private handleEnter = (e: MouseEvent) => {
    const item = e.currentTarget as HTMLElement
    item.classList.remove(...classNames)
    item.classList.add(`in-${directionsMap[this.getDirectionKey(e, item)]}`)
  }

  private handleLeave = (e: MouseEvent) => {
    const item = e.currentTarget as HTMLElement
    item.classList.remove(...classNames)
    item.classList.add(`out-${directionsMap[this.getDirectionKey(e, item)]}`)
  }

  private getDirectionKey(ev: MouseEvent, node: HTMLElement): number {
    const { width, height, top, left } = node.getBoundingClientRect()
    const l = ev.pageX - (left + window.pageXOffset)
    const t = ev.pageY - (top + window.pageYOffset)
    const x = l - (width / 2) * (width > height ? height / width : 1)
    const y = t - (height / 2) * (height > width ? width / height : 1)

    return Math.round(Math.atan2(y, x) / 1.57079633 + 5) % 4
  }

  destroy() {
    this.items.forEach(item => {
      item.removeEventListener('mouseenter', this.handleEnter)
      item.removeEventListener('mouseleave', this.handleLeave)
      item.classList.remove(...classNames)
      item.querySelector('.placeholder')?.remove()
      const img = item.querySelector('img')
      img?.classList.remove('real-image')
    })
    this.items = []
  }
}
