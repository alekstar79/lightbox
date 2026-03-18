type FullscreenEvent = 'change' | 'error';

const fullscreenMap = [
  ['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
  ['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
  ['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitFullScreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
  ['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'],
  ['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError'],
]

export interface IFullscreen {
  readonly isEnabled: boolean;
  readonly isFullscreen: boolean;
  readonly element: Element | null;
  toggle(element?: HTMLElement, options?: FullscreenOptions): Promise<void>;
  request(element?: HTMLElement, options?: FullscreenOptions): Promise<void>;
  exit(): Promise<void>;
  on(event: FullscreenEvent, callback: EventListener): void;
  off(event: FullscreenEvent, callback: EventListener): void;
}

export class Fullscreen implements IFullscreen {
  private requestFullscreen: string | null = null
  private exitFullscreen: string | null = null
  private fullscreenElement: string | null = null
  private fullscreenEnabled: string | null = null
  private fullscreenchange: string | null = null
  private fullscreenerror: string | null = null

  private isSupported: boolean = false

  constructor() {
    this.detectSupport()
  }

  private detectSupport(): void {
    for (const map of fullscreenMap) {
      const [req, exit, el, enabled, change, error] = map
      if (
        typeof (document as any)[req] !== 'undefined' ||
        typeof (document.documentElement as any)?.[req] !== 'undefined'
      ) {
        this.requestFullscreen = req
        this.exitFullscreen = exit
        this.fullscreenElement = el
        this.fullscreenEnabled = enabled
        this.fullscreenchange = change
        this.fullscreenerror = error
        this.isSupported = true
        break
      }
    }
  }

  public get isEnabled(): boolean {
    if (!this.isSupported) return false

    const prop = this.fullscreenEnabled
    return prop ? Boolean((document as any)[prop]) : false
  }

  public get isFullscreen(): boolean {
    if (!this.isSupported) return false

    const prop = this.fullscreenElement
    return prop ? Boolean((document as any)[prop]) : false
  }

  public get element(): Element | null {
    if (!this.isSupported) return null

    const prop = this.fullscreenElement
    return prop ? (document as any)[prop] || null : null
  }

  public toggle(element?: HTMLElement, options?: FullscreenOptions): Promise<void> {
    return this.isFullscreen ? this.exit() : this.request(element, options)
  }

  public request(element: HTMLElement = document.documentElement, options?: FullscreenOptions): Promise<void> {
    if (!this.isSupported) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const onFullScreenEntered = () => {
        this.off('change', onFullScreenEntered)
        resolve()
      }

      this.on('change', onFullScreenEntered)

      const requestMethod = (element as any)[this.requestFullscreen!]
      if (typeof requestMethod !== 'function') {
        reject(new Error('Fullscreen request method not found'))
        return;
      }

      const result = requestMethod.call(element, options)

      if (result instanceof Promise) {
        result.then(onFullScreenEntered).catch(reject)
      }
    })
  }

  public exit(): Promise<void> {
    if (!this.isSupported) return Promise.resolve()

    return new Promise((resolve, reject) => {
      if (!this.isFullscreen) {
        resolve()
        return
      }

      const onFullScreenExit = () => {
        this.off('change', onFullScreenExit)
        resolve()
      }

      this.on('change', onFullScreenExit)

      const exitMethod = (document as any)[this.exitFullscreen!]
      if (typeof exitMethod !== 'function') {
        reject(new Error('Fullscreen exit method not found'))
        return
      }

      const result = exitMethod.call(document)

      if (result instanceof Promise) {
        result.then(onFullScreenExit).catch(reject)
      }
    })
  }

  public on(event: FullscreenEvent, callback: EventListener): void {
    if (!this.isSupported) return

    const eventName = event === 'change' ? this.fullscreenchange : this.fullscreenerror
    if (eventName) {
      document.addEventListener(eventName, callback, false);
    }
  }

  public off(event: FullscreenEvent, callback: EventListener): void {
    if (!this.isSupported) return

    const eventName = event === 'change' ? this.fullscreenchange : this.fullscreenerror
    if (eventName) {
      document.removeEventListener(eventName, callback, false);
    }
  }
}
