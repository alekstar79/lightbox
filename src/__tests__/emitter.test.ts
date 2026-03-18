import { describe, it, expect, vi } from 'vitest'
import { Emitter } from '../core/emitter'

describe('Emitter', () => {
  it('should call a subscriber when an event is emitted', () => {
    const emitter = new Emitter()
    const listener = vi.fn()

    emitter.on('test-event', listener)
    emitter.emit('test-event', 'payload1', 123)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('payload1', 123)
  })

  it('should not call a subscriber after they have unsubscribed', () => {
    const emitter = new Emitter()
    const listener = vi.fn()

    const unsubscribe = emitter.on('test-event', listener)
    unsubscribe()

    emitter.emit('test-event')

    expect(listener).not.toHaveBeenCalled()
  })

  it('should call a "once" subscriber only one time', () => {
    const emitter = new Emitter()
    const listener = vi.fn()

    emitter.once('test-event', listener)

    emitter.emit('test-event')
    emitter.emit('test-event')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should apply await event binding for events emitted before subscription', () => {
    const emitter = new Emitter()
    const listener = vi.fn()

    emitter.emit('await-event', 'early-payload')
    emitter.on('await-event', listener)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('early-payload')
  })
})
