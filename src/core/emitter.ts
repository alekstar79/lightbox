type EventListener = (...data: any[]) => void;

interface AwaitEvent {
  id: string;
  data: any[];
}

export class Emitter {
  private events: Record<string, EventListener[]> = {}
  private awaitEventBinding: AwaitEvent[] = []

  private applyAwaitEvent(id: string, fn: EventListener): void {
    const pending = this.awaitEventBinding.find(e => e.id === id)

    if (pending) {
      fn.apply(this, pending.data)
    }
  }

  public on(id: string, fn: EventListener): () => void {
    (this.events[id] ||= []).push(fn)
    this.applyAwaitEvent(id, fn)

    return () => this.off(id, fn)
  }

  public once(id: string, fn: EventListener): void {
    const handler = (...args: any[]) => {
      this.off(id, handler)
      fn.apply(this, args)
    }

    this.on(id, handler)
  }

  public off(id: string, fn: EventListener): void {
    if (!this.events[id]) return

    const idx = this.events[id].indexOf(fn)
    if (idx > -1) {
      this.events[id].splice(idx, 1)
    }
  }

  public emit(id: string, ...data: any[]): void {
    this.awaitEventBinding = this.awaitEventBinding.filter(e => e.id !== id)

    const listeners = this.events[id]

    if (!listeners || listeners.length === 0) {
      this.awaitEventBinding.push({ id, data })
      return
    }

    listeners.forEach(fn => fn.apply(this, data))
  }
}

export const emitter = new Emitter()
