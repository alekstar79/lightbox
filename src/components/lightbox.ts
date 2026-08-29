import { Fullscreen, FullscreenState } from '../core/fullscreen'
import { Bindings } from '../core/bindings'

export interface LightboxClassMap {
  root: string;
  imageBox: string;
  prevBtn: string;
  nextBtn: string;
  closeBtn: string;
}

export interface LightboxDependencies {
  root: HTMLElement;
  shadow: HTMLElement;
  imageBox: HTMLElement;
  image: HTMLImageElement;
  currentCounter: HTMLElement;
  totalCounter: HTMLElement;
  expandBtn: HTMLElement;
  closeBtn: HTMLElement;
  prevBtn: HTMLElement;
  nextBtn: HTMLElement;
}

export interface LightboxOptions {
  deps: LightboxDependencies;
  keyboard: Bindings;
  classMap?: Partial<LightboxClassMap>;
}

export class Lightbox {
  private readonly deps: LightboxDependencies
  private readonly keyboard: Bindings

  private list: string[] = []
  private currentIndex: number = 0
  private lastClickedIndex: number = 0

  private nextHandler: () => void = () => {}
  private prevHandler: () => void = () => {}
  private toggleHandler: () => void = () => {}
  private closeHandler: () => void = () => {}
  private shadowHandler: () => void = () => {}
  private fullscreenChangeHandler: () => void = () => {}

  private unsubscribeFullscreen: (() => void) | null = null

  public onViewChange: () => void = () => {}

  constructor({ deps, keyboard, classMap }: LightboxOptions) {
    this.deps = deps
    this.keyboard = keyboard

    this.applyClassMap(classMap)
    this.bindEvents()
    this.bindKeyboard()
  }

  private applyClassMap(classMap?: Partial<LightboxClassMap>) {
    const cm = classMap || {}

    if (cm.root) this.deps.root.classList.add(cm.root)
    if (cm.imageBox) this.deps.imageBox.classList.add(cm.imageBox)
    if (cm.prevBtn) this.deps.prevBtn.classList.add(cm.prevBtn)
    if (cm.nextBtn) this.deps.nextBtn.classList.add(cm.nextBtn)
    if (cm.closeBtn) this.deps.closeBtn.classList.add(cm.closeBtn)
  }

  private bindEvents() {
    this.nextHandler = () => this.nextBtnClick()
    this.prevHandler = () => this.prevBtnClick()
    this.toggleHandler = () => this.toggleFullscreen()
    this.closeHandler = () => this.close()
    this.shadowHandler = () => this.close()
    this.fullscreenChangeHandler = () => this.onFullscreenChange()

    this.deps.nextBtn.addEventListener('click', this.nextHandler)
    this.deps.prevBtn.addEventListener('click', this.prevHandler)
    this.deps.expandBtn.addEventListener('click', this.toggleHandler)
    this.deps.closeBtn.addEventListener('click', this.closeHandler)
    this.deps.shadow.addEventListener('click', this.shadowHandler)

    this.unsubscribeFullscreen = Fullscreen.on('change', this.fullscreenChangeHandler)
  }

  private bindKeyboard() {
    this.keyboard.bind([
      { keys: 'ArrowRight', handler: this.nextHandler },
      { keys: 'ArrowLeft', handler: this.prevHandler }
    ])

    this.keyboard.track()
  }

  public open(index: number, list: string[]) {
    this.list = list
    this.currentIndex = index
    this.lastClickedIndex = index

    this.deps.totalCounter.textContent = `${list.length}`
    this.deps.root.classList.add('show')
    this.deps.shadow.style.display = 'block'

    document.body.style.overflow = 'hidden'

    this.updateView()
  }

  public async close() {
    this.list = []
    this.currentIndex = this.lastClickedIndex
    this.deps.root.classList.remove('show')
    this.deps.shadow.style.display = 'none'

    document.body.style.overflow = 'auto'

    if (Fullscreen.state === FullscreenState.ON) {
      await Fullscreen.exit()
    }
  }

  private nextBtnClick() {
    if (this.currentIndex >= this.list.length - 1) return

    this.currentIndex++
    this.updateView()
  }

  private prevBtnClick() {
    if (this.currentIndex === 0) return

    this.currentIndex--
    this.updateView()
  }

  private async toggleFullscreen() {
    await Fullscreen.toggle(this.deps.root)
  }

  private onFullscreenChange() {
    const isFullscreen = Fullscreen.state === FullscreenState.ON

    this.deps.root.classList.toggle('fullscreen', isFullscreen)
    this.deps.imageBox.classList.toggle('fullscreen', isFullscreen)
  }

  private updateView() {
    this.onViewChange()

    this.deps.nextBtn.classList.toggle('hide', this.currentIndex >= this.list.length - 1)
    this.deps.prevBtn.classList.toggle('hide', this.currentIndex === 0)
    this.deps.currentCounter.textContent = `${this.currentIndex + 1}`
    this.deps.image.src = this.list[this.currentIndex]
  }

  public destroy() {
    this.deps.nextBtn.removeEventListener('click', this.nextHandler)
    this.deps.prevBtn.removeEventListener('click', this.prevHandler)
    this.deps.expandBtn.removeEventListener('click', this.toggleHandler)
    this.deps.closeBtn.removeEventListener('click', this.closeHandler)
    this.deps.shadow.removeEventListener('click', this.shadowHandler)

    this.unsubscribeFullscreen?.()

    this.keyboard.untrack()
    this.keyboard.dispose()
  }
}
