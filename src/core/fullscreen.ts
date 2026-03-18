const fullscreenMap = [
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror'
  ],
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror'
  ],
  [
    'webkitRequestFullScreen',
    'webkitCancelFullScreen',
    'webkitCurrentFullScreenElement',
    'webkitCancelFullScreen',
    'webkitfullscreenchange',
    'webkitfullscreenerror'
  ],
  [
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror'
  ],
  [
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError'
  ],
]

interface FullscreenApi {
  requestFullscreen: string;
  exitFullscreen: string;
  fullscreenElement: string;
  fullscreenEnabled: string;
  fullscreenchange: string;
  fullscreenerror: string;
}

const fn: Partial<FullscreenApi> = {}
const isEnabled = fullscreenMap.some(map => {
  if (map[1] in document) {
    for (let i = 0; i < map.length; i++) {
      (fn as any)[fullscreenMap[0][i]] = map[i]
    }

    return true
  }

  return false
})

const eventMap = { change: fn.fullscreenchange, error: fn.fullscreenerror }

const handler = {
  toggle(element?: HTMLElement, options?: FullscreenOptions): Promise<void> {
    return this.isFullscreen ? this.exit() : this.request(element, options)
  },

  request(element: HTMLElement = document.documentElement, options?: FullscreenOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const onFullScreenEntered = () => {
        this.off('change', onFullScreenEntered)
        resolve()
      }

      this.on('change', onFullScreenEntered)

      const request = (element as any)[fn.requestFullscreen!]?.(options)

      if (request instanceof Promise) {
        request.then(onFullScreenEntered).catch(reject)
      }
    })
  },

  exit(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isFullscreen) {
        resolve()
        return
      }

      const onFullScreenExit = () => {
        this.off('change', onFullScreenExit)
        resolve()
      };

      this.on('change', onFullScreenExit)

      const exit = (document as any)[fn.exitFullscreen!]?.()

      if (exit instanceof Promise) {
        exit.then(onFullScreenExit).catch(reject)
      }
    })
  },

  on(event: 'change' | 'error', callback: EventListener): void {
    const eventName = eventMap[event]

    if (eventName) {
      document.addEventListener(eventName, callback, false)
    }
  },

  off(event: 'change' | 'error', callback: EventListener): void {
    const eventName = eventMap[event]

    if (eventName) {
      document.removeEventListener(eventName, callback, false)
    }
  },

  get isFullscreen(): boolean {
    return Boolean((document as any)[fn.fullscreenElement!])
  },

  get isEnabled(): boolean {
    return Boolean((document as any)[fn.fullscreenEnabled!])
  },

  get element(): Element | null {
    return (document as any)[fn.fullscreenElement!] || null
  },
}

export const fullscreen = isEnabled
  ? handler
  : {
      isEnabled: false,
      isFullscreen: false,
      element: null,
      toggle: () => Promise.resolve(),
      on: () => {},
      off: () => {},
      request: () => Promise.resolve(),
      exit: () => Promise.resolve()
    }
