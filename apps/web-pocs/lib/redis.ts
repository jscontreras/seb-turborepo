if (!process.env.REDIS_URL) {
  console.warn("REDIS_URL environment variable is not set - using localStorage fallback")
}

// Parse Redis URL to extract connection details
function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: Number.parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      protocol: parsed.protocol.replace(":", ""),
    }
  } catch (error) {
    throw new Error(`Invalid REDIS_URL format: ${error}`)
  }
}

// Persistent storage fallback using a simple key-value store
class PersistentStorage {
  private storage = new Map<string, any>()
  private lists = new Map<string, string[]>()
  private storageKey = "audio_library_data"

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      // In server environment, we'll use a simple file-based approach
      // In client environment, this won't be called
      if (typeof window === "undefined") {
        // Server-side: use in-memory with persistence simulation
        const stored = global.audioLibraryData
        if (stored) {
          this.storage = new Map(stored.storage || [])
          this.lists = new Map(stored.lists || [])
        }
      }
    } catch (error) {
      console.warn("Failed to load from storage:", error)
    }
  }

  private saveToStorage() {
    try {
      if (typeof window === "undefined") {
        // Server-side: store in global for persistence across requests
        global.audioLibraryData = {
          storage: Array.from(this.storage.entries()),
          lists: Array.from(this.lists.entries()),
          timestamp: Date.now(),
        }
      }
    } catch (error) {
      console.warn("Failed to save to storage:", error)
    }
  }

  async hset(key: string, data: Record<string, any>) {
    if (!this.storage.has(key)) {
      this.storage.set(key, {})
    }
    const hash = this.storage.get(key)
    Object.assign(hash, data)
    this.saveToStorage()
    return 1
  }

  async hgetall(key: string) {
    return this.storage.get(key) || {}
  }

  async del(key: string) {
    const existed = this.storage.has(key) || this.lists.has(key)
    this.storage.delete(key)
    this.lists.delete(key)
    this.saveToStorage()
    return existed ? 1 : 0
  }

  async lpush(key: string, value: string) {
    if (!this.lists.has(key)) {
      this.lists.set(key, [])
    }
    const list = this.lists.get(key)!
    list.unshift(value)
    this.saveToStorage()
    return list.length
  }

  async lrange(key: string, start: number, stop: number) {
    const targetList = this.lists.get(key) || []
    return targetList.slice(start, stop === -1 ? undefined : stop + 1)
  }

  async lrem(key: string, count: number, value: string) {
    const listToModify = this.lists.get(key) || []
    const index = listToModify.indexOf(value)
    if (index > -1) {
      listToModify.splice(index, 1)
      this.saveToStorage()
    }
    return 1
  }

  async exists(key: string) {
    return this.storage.has(key) || this.lists.has(key) ? 1 : 0
  }

  async keys(pattern: string) {
    const allKeys = [...this.storage.keys(), ...this.lists.keys()]
    if (pattern === "*") return allKeys
    const regex = new RegExp(pattern.replace("*", ".*"))
    return allKeys.filter((k) => regex.test(k))
  }

  async ping() {
    return "PONG"
  }
}

// HTTP-based Redis client for Upstash/Redis Cloud
class HttpRedisClient {
  private baseUrl: string
  private token: string

  constructor(url: string) {
    // Extract token from URL if it's an Upstash URL
    if (url.includes("@")) {
      const parts = url.split("@")
      this.token = parts[0].split("//")[1]
      this.baseUrl = `https://${parts[1]}`
    } else {
      this.baseUrl = url
      this.token = ""
    }
  }

  private async executeCommand(command: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: JSON.stringify(command),
      })

      if (!response.ok) {
        throw new Error(`Redis HTTP command failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.result
    } catch (error) {
      console.error("Redis HTTP command error:", error)
      throw error
    }
  }

  async hset(key: string, data: Record<string, any>) {
    const args = Object.entries(data).flat().map(String)
    return this.executeCommand(["HSET", key, ...args])
  }

  async hgetall(key: string) {
    const result = await this.executeCommand(["HGETALL", key])
    // Convert array result to object
    if (Array.isArray(result)) {
      const obj: Record<string, string> = {}
      for (let i = 0; i < result.length; i += 2) {
        obj[result[i]] = result[i + 1]
      }
      return obj
    }
    return result || {}
  }

  async del(key: string) {
    return this.executeCommand(["DEL", key])
  }

  async lpush(key: string, value: string) {
    return this.executeCommand(["LPUSH", key, value])
  }

  async lrange(key: string, start: number, stop: number) {
    return this.executeCommand(["LRANGE", key, start.toString(), stop.toString()])
  }

  async lrem(key: string, count: number, value: string) {
    return this.executeCommand(["LREM", key, count.toString(), value])
  }

  async exists(key: string) {
    return this.executeCommand(["EXISTS", key])
  }

  async keys(pattern: string) {
    return this.executeCommand(["KEYS", pattern])
  }

  async ping() {
    return this.executeCommand(["PING"])
  }
}

// Main Redis client with fallback
class RedisClient {
  private client: HttpRedisClient | PersistentStorage
  private isRedisAvailable = false

  constructor() {
    if (process.env.REDIS_URL) {
      const redisConfig = parseRedisUrl(process.env.REDIS_URL)

      if (redisConfig.protocol === "https" || redisConfig.protocol === "http") {
        // HTTP-based Redis (Upstash, Redis Cloud with HTTP API)
        this.client = new HttpRedisClient(process.env.REDIS_URL)
        this.isRedisAvailable = true
        console.log("Using HTTP Redis client")
      } else {
        // Standard Redis protocol - use persistent fallback
        console.warn("Standard Redis protocol detected. Using persistent storage fallback.")
        this.client = new PersistentStorage()
      }
    } else {
      // No Redis URL - use persistent fallback
      console.warn("No REDIS_URL provided. Using persistent storage fallback.")
      this.client = new PersistentStorage()
    }
  }

  async testConnection() {
    try {
      const result = await this.client.ping()
      this.isRedisAvailable = result === "PONG"
      return this.isRedisAvailable
    } catch (error) {
      console.error("Redis connection test failed:", error)
      this.isRedisAvailable = false
      return false
    }
  }

  async hset(key: string, data: Record<string, any>) {
    try {
      return await this.client.hset(key, data)
    } catch (error) {
      console.error("Redis HSET error:", error)
      throw error
    }
  }

  async hgetall(key: string) {
    try {
      return await this.client.hgetall(key)
    } catch (error) {
      console.error("Redis HGETALL error:", error)
      return {}
    }
  }

  async del(key: string) {
    try {
      return await this.client.del(key)
    } catch (error) {
      console.error("Redis DEL error:", error)
      return 0
    }
  }

  async lpush(key: string, value: string) {
    try {
      return await this.client.lpush(key, value)
    } catch (error) {
      console.error("Redis LPUSH error:", error)
      throw error
    }
  }

  async lrange(key: string, start: number, stop: number) {
    try {
      return await this.client.lrange(key, start, stop)
    } catch (error) {
      console.error("Redis LRANGE error:", error)
      return []
    }
  }

  async lrem(key: string, count: number, value: string) {
    try {
      return await this.client.lrem(key, count, value)
    } catch (error) {
      console.error("Redis LREM error:", error)
      return 0
    }
  }

  async exists(key: string) {
    try {
      return await this.client.exists(key)
    } catch (error) {
      console.error("Redis EXISTS error:", error)
      return 0
    }
  }

  async keys(pattern: string) {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      console.error("Redis KEYS error:", error)
      return []
    }
  }

  async ping() {
    try {
      return await this.client.ping()
    } catch (error) {
      console.error("Redis PING error:", error)
      throw error
    }
  }

  getConnectionStatus() {
    return {
      isRedisAvailable: this.isRedisAvailable,
      clientType: this.client instanceof HttpRedisClient ? "HTTP Redis" : "Persistent Storage",
    }
  }
}

export const redis = new RedisClient()

// Redis key patterns
export const REDIS_KEYS = {
  AUDIO_PREFIX: "audio:",
  AUDIO_LIST: "audio:list",
  AUDIO_SEARCH: "audio:search:",
} as const

// Global type declaration for Node.js global
declare global {
  var audioLibraryData:
    | {
        storage: [string, any][]
        lists: [string, string[]][]
        timestamp: number
      }
    | undefined
}
