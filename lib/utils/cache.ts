import { CACHE_WINDOW_SIZE } from "@/lib/constants"

export class WindowedCache<T> {
  private cache: Map<number, T> = new Map()
  private windowSize: number
  private currentCenter = 0

  constructor(windowSize: number = CACHE_WINDOW_SIZE) {
    this.windowSize = windowSize
  }

  set(key: number, value: T): void {
    this.cache.set(key, value)
    this.cleanup(key)
  }

  get(key: number): T | undefined {
    return this.cache.get(key)
  }

  has(key: number): boolean {
    return this.cache.has(key)
  }

  private cleanup(currentKey: number): void {
    this.currentCenter = currentKey
    const halfWindow = Math.floor(this.windowSize / 2)

    for (const key of this.cache.keys()) {
      if (Math.abs(key - currentKey) > halfWindow) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}
