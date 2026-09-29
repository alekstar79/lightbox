export class LRUCache<K, V> {
  private readonly map = new Map<K, V>()

  constructor(private readonly maxSize: number) {
    if (maxSize < 1) throw new Error('LRUCache: maxSize must be >= 1')
  }

  public get size(): number {
    return this.map.size
  }

  public has(key: K): boolean {
    return this.map.has(key)
  }

  public get(key: K): V | undefined {
    const value = this.map.get(key)
    if (value === undefined) return undefined

    // touch: move to the end (the "newest" position)
    this.map.delete(key)
    this.map.set(key, value)

    return value
  }

  public set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    }

    this.map.set(key, value)

    if (this.map.size > this.maxSize) {
      // the first key is the oldest
      const oldest = this.map.keys().next().value as K
      this.map.delete(oldest)
    }
  }

  public clear(): void {
    this.map.clear()
  }
}
