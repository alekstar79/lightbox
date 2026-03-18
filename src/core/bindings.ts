interface KeybindSource {
  keys: string;
  handler: (e: KeyboardEvent) => void;
}

class KeyCombination {
  private readonly code: string

  constructor(keyIdentifier: string) {
    this.code = keyIdentifier
  }

  public match(e: KeyboardEvent): boolean {
    return e.code === this.code
  }
}

class Keybind {
  public combination: KeyCombination
  public handler: (e: KeyboardEvent) => void

  constructor(kc: KeyCombination, handler: (e: KeyboardEvent) => void) {
    this.combination = kc
    this.handler = handler
  }
}

export class Bindings {
  private static self: Bindings | null = null
  private keybinds: Set<Keybind> = new Set()

  public static init(): Bindings {
    return Bindings.self ||= new Bindings()
  }

  constructor() {
    this.handler = this.handler.bind(this)
    this.track = this.track.bind(this)
    this.untrack = this.untrack.bind(this)
    this.bind = this.bind.bind(this)
    this.unbind = this.unbind.bind(this)
    this.dispose = this.dispose.bind(this)
  }

  private handler(e: KeyboardEvent): void {
    if (e.repeat) return

    for (const kb of this.keybinds) {
      if (kb.combination.match(e)) {
        e.stopImmediatePropagation()
        e.preventDefault()
        kb.handler(e)
        break
      }
    }
  }

  public on(keys: string, handler: (e: KeyboardEvent) => void): Keybind {
    const kb = new Keybind(new KeyCombination(keys), handler)
    this.keybinds.add(kb)
    return kb
  }

  public bind(source: KeybindSource[]): Keybind[] {
    return source.map(b => this.on(b.keys, b.handler))
  }

  public unbind(map?: Keybind[]): void {
    if (map) {
      map.forEach(kb => this.keybinds.delete(kb))
    } else {
      this.keybinds.clear()
    }
  }

  public track(): void {
    window.addEventListener('keydown', this.handler)
  }

  public untrack(): void {
    window.removeEventListener('keydown', this.handler)
  }

  public dispose(): void {
    this.keybinds.clear()
  }
}
