import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Bindings } from '../core/bindings'

describe('Bindings', () => {
  let bindings: Bindings

  beforeEach(() => {
    bindings = new Bindings()
  })

  afterEach(() => {
    bindings.untrack()
    // @ts-ignore
    Bindings.self = null
  })

  it('should create singleton instance', () => {
    const b1 = Bindings.init()
    const b2 = Bindings.init()
    expect(b1).toBe(b2)
  })

  it('should bind a handler to a key', () => {
    const handler = vi.fn()
    bindings.bind([{ keys: 'ArrowRight', handler }])
    bindings.track()

    const event = new KeyboardEvent('keydown', { code: 'ArrowRight' })
    window.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should not call handler for a different key', () => {
    const handler = vi.fn()
    bindings.bind([{ keys: 'ArrowRight', handler }])
    bindings.track()

    const event = new KeyboardEvent('keydown', { code: 'ArrowLeft' })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not call handler on key repeat', () => {
    const handler = vi.fn()
    bindings.bind([{ keys: 'ArrowRight', handler }])
    bindings.track()

    const event = new KeyboardEvent('keydown', { code: 'ArrowRight', repeat: true })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should unbind all handlers when called without arguments', () => {
    const handler = vi.fn()
    bindings.bind([{ keys: 'ArrowRight', handler }])
    bindings.track()
    bindings.unbind()

    const event = new KeyboardEvent('keydown', { code: 'ArrowRight' })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should unbind specific handlers when called with arguments', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const keybinds = bindings.bind([
      { keys: 'ArrowRight', handler: handler1 },
      { keys: 'ArrowLeft', handler: handler2 }
    ])

    bindings.track()
    bindings.unbind([keybinds[0]])

    const eventRight = new KeyboardEvent('keydown', { code: 'ArrowRight' })
    window.dispatchEvent(eventRight)
    expect(handler1).not.toHaveBeenCalled()

    const eventLeft = new KeyboardEvent('keydown', { code: 'ArrowLeft' })
    window.dispatchEvent(eventLeft)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('should untrack event listeners', () => {
    const handler = vi.fn()
    bindings.bind([{ keys: 'ArrowRight', handler }])
    bindings.track()

    bindings.untrack()

    const event = new KeyboardEvent('keydown', { code: 'ArrowRight' })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('should clear all keybinds on dispose', () => {
    const handler = vi.fn()
    bindings.bind([{ keys: 'ArrowRight', handler }])
    bindings.track()

    bindings.dispose()

    const event = new KeyboardEvent('keydown', { code: 'ArrowRight' })
    window.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })
})
