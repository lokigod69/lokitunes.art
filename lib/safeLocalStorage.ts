/**
 * Safe localStorage wrapper for iOS Safari compatibility
 *
 * iOS Safari blocks localStorage in:
 * - Private browsing mode
 * - Cross-origin iframes
 * - When "Prevent Cross-Site Tracking" is enabled
 *
 * This wrapper provides a fallback to in-memory storage so the app
 * can keep working even when localStorage is unavailable.
 */

class SafeLocalStorage {
  private memoryStorage: Map<string, string> = new Map()
  private isAvailable = false

  constructor() {
    this.checkAvailability()
  }

  private checkAvailability(): void {
    // Guard against SSR where window/localStorage are not defined
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      this.isAvailable = false
      return
    }

    try {
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      this.isAvailable = true
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SafeLocalStorage] localStorage not available, using memory fallback:', e)
      }
      this.isAvailable = false
    }
  }

  getItem(key: string): string | null {
    if (this.isAvailable) {
      try {
        return window.localStorage.getItem(key)
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SafeLocalStorage] Failed to get "${key}" from localStorage:`, e)
        }
      }
    }

    return this.memoryStorage.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.setItem(key, value)
        return
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SafeLocalStorage] Failed to set "${key}" in localStorage:`, e)
        }
      }
    }

    this.memoryStorage.set(key, value)
  }

  removeItem(key: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.removeItem(key)
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SafeLocalStorage] Failed to remove "${key}" from localStorage:`, e)
        }
      }
    }

    this.memoryStorage.delete(key)
  }

  clear(): void {
    if (this.isAvailable) {
      try {
        window.localStorage.clear()
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SafeLocalStorage] Failed to clear localStorage:', e)
        }
      }
    }

    this.memoryStorage.clear()
  }
}

export const safeLocalStorage = new SafeLocalStorage()
