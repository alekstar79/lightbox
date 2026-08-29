export enum FullscreenState {
  UNSUPPORTED = 'unsupported',
  OFF = 'off',
  ON = 'on'
}

export enum FullscreenErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  IOS_VIDEO_ONLY = 'IOS_VIDEO_ONLY',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export class FullscreenError extends Error {
  readonly code: FullscreenErrorCode

  constructor(code: FullscreenErrorCode, message: string) {
    super(message)
    this.name = 'FullscreenError'
    this.code = code
  }
}

export interface FullscreenOptions {
  navigationUI?: 'auto' | 'show' | 'hide';
}

export interface FullscreenInfo {
  element: HTMLElement | null;
  state: FullscreenState;
  isVideoOnly: boolean;
  supportedAPI?: SupportedAPI;
}

type Prefix = '' | 'webkit' | 'moz' | 'ms';

export type FullscreenRequest = `${Prefix}RequestFullscreen`;
export type FullscreenExit = `${Prefix}ExitFullscreen` | `mozCancelFullScreen`;
export type FullscreenElement = `${Prefix}FullscreenElement`;
export type FullscreenEnabled = `${Prefix}FullscreenEnabled`;
export type FullscreenChange = `${Prefix}fullscreenchange` | 'MSFullscreenChange';
export type FullscreenErrorEvent = `${Prefix}fullscreenerror` | 'MSFullscreenError';

export interface SupportedAPI {
  readonly request: FullscreenRequest;
  readonly exit: FullscreenExit;
  readonly element: FullscreenElement;
  readonly enabled: FullscreenEnabled;
  readonly change: FullscreenChange;
  readonly error: FullscreenErrorEvent;
}

export type EventCallback = (info: FullscreenInfo) => void;
export type NativeEventHandler = (e: Event) => void;

export class Fullscreen {
  private static supportedAPI: SupportedAPI | null = null
  private static eventCallbacks = new Map<string, Set<EventCallback>>()
  private static isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  private static isInitialized = false

  private static readonly apiMappings: SupportedAPI[] = [
    {
      request: 'requestFullscreen' as FullscreenRequest,
      exit: 'exitFullscreen' as FullscreenExit,
      element: 'fullscreenElement' as FullscreenElement,
      enabled: 'fullscreenEnabled' as FullscreenEnabled,
      change: 'fullscreenchange' as FullscreenChange,
      error: 'fullscreenerror' as FullscreenErrorEvent
    },
    {
      request: 'webkitRequestFullscreen' as FullscreenRequest,
      exit: 'webkitExitFullscreen' as FullscreenExit,
      element: 'webkitFullscreenElement' as FullscreenElement,
      enabled: 'webkitFullscreenEnabled' as FullscreenEnabled,
      change: 'webkitfullscreenchange' as FullscreenChange,
      error: 'webkitfullscreenerror' as FullscreenErrorEvent
    },
    {
      request: 'mozRequestFullScreen' as FullscreenRequest,
      exit: 'mozCancelFullScreen' as FullscreenExit,
      element: 'mozFullScreenElement' as FullscreenElement,
      enabled: 'mozFullScreenEnabled' as FullscreenEnabled,
      change: 'mozfullscreenchange' as FullscreenChange,
      error: 'mozfullscreenerror' as FullscreenErrorEvent
    },
    {
      request: 'msRequestFullscreen' as FullscreenRequest,
      exit: 'msExitFullscreen' as FullscreenExit,
      element: 'msFullscreenElement' as FullscreenElement,
      enabled: 'msFullscreenEnabled' as FullscreenEnabled,
      change: 'MSFullscreenChange' as FullscreenChange,
      error: 'MSFullscreenError' as FullscreenErrorEvent
    }
  ]

  public static init(): void {
    if (this.isInitialized || typeof document === 'undefined') return

    this.supportedAPI = this.apiMappings.find(api =>
      api.request in document.documentElement
    ) || null

    if (this.supportedAPI) {
      document.addEventListener(this.supportedAPI.change, this.handleChange)
      document.addEventListener(this.supportedAPI.error, this.handleError)
    }

    this.isInitialized = true
  }

  public static get isSupported(): boolean {
    return this.supportedAPI !== null
  }

  public static get state(): FullscreenState {
    if (typeof document === 'undefined' || !this.supportedAPI) {
      return FullscreenState.UNSUPPORTED
    }

    return (document as any)[this.supportedAPI.element]
      ? FullscreenState.ON
      : FullscreenState.OFF
  }

  public static get element(): HTMLElement | null {
    return typeof document !== 'undefined' && this.supportedAPI
      ? (document as any)[this.supportedAPI.element] || null
      : null
  }

  public static get isEnabled(): boolean {
    return typeof document !== 'undefined' && this.supportedAPI
      ? !!(document as any)[this.supportedAPI.enabled]
      : false
  }

  public static async enter(
    element: HTMLElement = document.documentElement,
    options: FullscreenOptions = {}
  ): Promise<FullscreenState> {
    if (!this.isSupported) {
      throw new FullscreenError(
        FullscreenErrorCode.NOT_SUPPORTED,
        'Fullscreen API not supported'
      )
    }
    if (this.isIOS && element.tagName !== 'VIDEO') {
      throw new FullscreenError(
        FullscreenErrorCode.IOS_VIDEO_ONLY,
        'iOS supports fullscreen only for video elements'
      )
    }
    if (!this.isEnabled) {
      throw new FullscreenError(
        FullscreenErrorCode.NOT_SUPPORTED,
        'Fullscreen not enabled'
      )
    }

    return this.executeFullscreenRequest(element, options)
  }

  public static async exit(): Promise<FullscreenState> {
    if (!this.isSupported || this.state === FullscreenState.OFF) {
      return FullscreenState.OFF
    }

    await this.executeFullscreenExit()
    return this.state
  }

  public static async toggle(
    element?: HTMLElement,
    options?: FullscreenOptions
  ): Promise<FullscreenState> {
    return this.state === FullscreenState.ON
      ? this.exit()
      : this.enter(element || document.documentElement, options)
  }

  public static info(): FullscreenInfo {
    return {
      element: this.element,
      state: this.state,
      isVideoOnly: this.isIOS,
      supportedAPI: this.supportedAPI || undefined
    }
  }

  public static on(event: 'change' | 'error', callback: EventCallback): () => void {
    const callbacks = this.eventCallbacks.get(event) || new Set()

    callbacks.add(callback)
    this.eventCallbacks.set(event, callbacks)

    return () => this.off(event, callback)
  }

  public static off(event: 'change' | 'error', callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(event)

    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  public static destroy(): void {
    if (!this.isInitialized || typeof document === 'undefined') return

    if (this.supportedAPI) {
      document.removeEventListener(this.supportedAPI.change, this.handleChange)
      document.removeEventListener(this.supportedAPI.error, this.handleError)
    }

    this.eventCallbacks.clear()
    this.isInitialized = false
  }

  private static async executeFullscreenRequest(
    element: HTMLElement,
    options: FullscreenOptions
  ): Promise<FullscreenState> {
    return new Promise((resolve, reject) => {
      const onChange: NativeEventHandler = () => {
        this.offNativeEvents()
        resolve(this.state)
      }

      const onError: NativeEventHandler = () => {
        this.offNativeEvents()

        reject(new FullscreenError(
          FullscreenErrorCode.PERMISSION_DENIED,
          'Permission denied'
        ))
      }

      this.onNativeEvents(onChange, onError)

      try {
        (element as any)[this.supportedAPI!.request](options)
      } catch (error) {
        this.offNativeEvents()
        reject(error)
      }
    })
  }

  private static async executeFullscreenExit(): Promise<void> {
    if (!this.supportedAPI) return

    return new Promise((resolve) => {
      const onChange: NativeEventHandler = () => {
        this.offNativeEvents()
        resolve()
      }

      const onError: NativeEventHandler = () => {
        this.offNativeEvents()
        resolve()
      }

      this.onNativeEvents(onChange, onError)

      try {
        (document as any)[this.supportedAPI!.exit]()
      } catch {
        this.offNativeEvents()
        resolve()
      }
    })
  }

  private static onNativeEvents(
    onChange: NativeEventHandler,
    onError: NativeEventHandler
  ): void {
    if (!this.supportedAPI) return

    document.addEventListener(this.supportedAPI.change, onChange, { once: true })
    document.addEventListener(this.supportedAPI.error, onError, { once: true })
  }

  private static offNativeEvents(): void {
  }

  private static readonly handleChange: NativeEventHandler = (_e: Event): void => {
    const info = this.info()
    this.eventCallbacks.get('change')?.forEach(cb => cb(info))
  }

  private static readonly handleError: NativeEventHandler = (_e: Event): void => {
    const info = this.info()
    this.eventCallbacks.get('error')?.forEach(cb => cb(info))
  }
}
