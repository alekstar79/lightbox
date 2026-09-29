import { LRUCache } from './lru-cache'

export interface PreloaderOptions {
  radius?: number
  maxEntries?: number
}

export class Preloader {
  private readonly cache: LRUCache<string, HTMLImageElement>
  private readonly radius: number

  constructor(options: PreloaderOptions = {}) {
    this.radius = options.radius ?? 2
    this.cache = new LRUCache<string, HTMLImageElement>(options.maxEntries ?? 10)
  }

  public preload(url: string): void {
    if (!url) return

    if (this.cache.has(url)) {
      this.cache.get(url)
      return
    }

    const img = new Image()
    img.decoding = 'async'
    img.src = url

    this.cache.set(url, img)
  }

  public preloadMany(urls: readonly string[]): void {
    for (const url of urls) this.preload(url)
  }

  public preloadAround(list: readonly string[], index: number): void {
    for (let offset = -this.radius; offset <= this.radius; offset++) {
      if (offset === 0) continue

      const target = index + offset
      if (target < 0 || target >= list.length) continue

      this.preload(list[target])
    }
  }

  public has(url: string): boolean {
    return this.cache.has(url)
  }

  public clear(): void {
    this.cache.clear()
  }
}
