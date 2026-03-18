import { Bindings } from '../core/bindings'
import { fullscreen } from '../core/fullscreen'

export class Lightbox {
  private static instance: Lightbox

  private gallery: string[] = []
  private newIndex: number = 0
  private clickedIndex: number = 0

  private readonly keyboard?: Bindings

  private readonly previewBox: HTMLElement
  private previewImg: HTMLImageElement
  private imageBox: HTMLElement
  private currentImg: HTMLElement
  private totalImg: HTMLElement
  private expandIcon: HTMLElement
  private closeIcon: HTMLElement
  private prevBtn: HTMLElement
  private nextBtn: HTMLElement
  private shadow: HTMLElement

  public static preview: () => void = () => {}

  private get nextBtnHide(): boolean {
    return this.newIndex >= this.gallery.length - 1
  }

  private get prevBtnHide(): boolean {
    return this.newIndex === 0
  }

  public static init(keyboard?: Bindings): Lightbox {
    return Lightbox.instance ||= new Lightbox(keyboard)
  }

  private static get<T extends HTMLElement>(selector: string, parent: HTMLElement | Document = document): T {
    return parent.querySelector(selector) as T
  }

  private constructor(keyboard?: Bindings) {
    this.keyboard = keyboard

    this.previewBox = Lightbox.get('.preview-box')
    this.previewImg = Lightbox.get('img', this.previewBox)
    this.imageBox = Lightbox.get('.image-box', this.previewBox)
    this.currentImg = Lightbox.get('.current-img', this.previewBox)
    this.expandIcon = Lightbox.get('.fa-expand', this.previewBox)
    this.closeIcon = Lightbox.get('.fa-times', this.previewBox)
    this.totalImg = Lightbox.get('.total-img', this.previewBox)
    this.prevBtn = Lightbox.get('.prev', this.previewBox)
    this.nextBtn = Lightbox.get('.next', this.previewBox)
    this.shadow = Lightbox.get('.shadow')

    this.bindings()
    this.addListeners()
    this.keybind()
  }

  private bindings(): void {
    this.nextBtnClick = this.nextBtnClick.bind(this)
    this.prevBtnClick = this.prevBtnClick.bind(this)
    this.toggle = this.toggle.bind(this)
    this.close = this.close.bind(this)
    this.onFullscreenChange = this.onFullscreenChange.bind(this)
  }

  private addListeners(): void {
    this.nextBtn.addEventListener('click', this.nextBtnClick)
    this.prevBtn.addEventListener('click', this.prevBtnClick)
    this.expandIcon.addEventListener('click', this.toggle)
    this.closeIcon.addEventListener('click', this.close)
    this.shadow.addEventListener('click', this.close)
    fullscreen.on('change', this.onFullscreenChange)
  }

  private onFullscreenChange(): void {
    // Изменено: добавляем класс 'fullscreen' к previewBox
    this.previewBox.classList.toggle('fullscreen', fullscreen.isFullscreen)
    // Также добавляем класс к imageBox, если это необходимо для других стилей
    this.imageBox.classList.toggle('fullscreen', fullscreen.isFullscreen)
  }

  private keybind(): void {
    if (!this.keyboard) return

    this.keyboard.bind([
      { keys: 'ArrowRight', handler: this.nextBtnClick },
      { keys: 'ArrowLeft', handler: this.prevBtnClick },
    ])

    this.keyboard.track()
  }

  private async toggle(): Promise<void> {
    await fullscreen.toggle(this.previewBox)
  }

  private view(): void {
    Lightbox.preview()

    this.nextBtn.classList[this.nextBtnHide ? 'add' : 'remove']('hide')
    this.prevBtn.classList[this.prevBtnHide ? 'add' : 'remove']('hide')

    this.currentImg.textContent = `${this.newIndex + 1}`
    this.previewImg.src = this.gallery[this.newIndex]
  }

  public open(idx: number, list: string[]): void {
    document.body.style.overflow = 'hidden'

    this.gallery = list;
    this.clickedIndex = this.newIndex = idx
    this.totalImg.textContent = `${list.length}`
    this.previewBox.classList.add('show')
    this.shadow.style.display = 'block'

    this.view()
  }

  public async close(): Promise<void> {
    document.body.style.overflow = 'auto'

    this.gallery = []
    this.newIndex = this.clickedIndex
    this.previewBox.classList.remove('show')
    this.shadow.style.display = 'none'

    if (fullscreen.isFullscreen) {
      await fullscreen.exit()
    }
  }

  private nextBtnClick(): void {
    if (this.nextBtnHide) return;
    this.newIndex++;
    this.view();
  }

  private prevBtnClick(): void {
    if (this.prevBtnHide) return
    this.newIndex--
    this.view()
  }
}
