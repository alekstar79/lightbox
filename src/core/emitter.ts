type EventListener = (...data: any[]) => void;

interface AwaitEvent {
  id: string;
  data: any[];
}

export class Emitter {
  private events: Record<string, EventListener[]> = {}
  private awaitEventBinding: AwaitEvent[] = []

  private applyAwaitEvent(id: string, fn: EventListener): void {
    const index = this.awaitEventBinding.findIndex(e => e.id === id)

    if (index > -1) {
      fn.apply(this, this.awaitEventBinding[index].data)
      this.awaitEventBinding.splice(index, 1)
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
    if (!this.events[id]) {
      this.awaitEventBinding.push({ id, data })
    }

    (this.events[id] || []).forEach(fn => fn.apply(this, data))
  }
}

export const emitter = new Emitter()
