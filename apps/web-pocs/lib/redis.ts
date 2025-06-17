import { createClient } from "redis";

// Redis client using the standard redis package
class RedisClient {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    if (!process.env.REDIS_URL) {
      console.error("REDIS_URL environment variable is not set");
      return;
    }

    try {
      console.log(
        "Initializing Redis client with URL:",
        process.env.REDIS_URL.replace(/\/\/.*@/, "//***@"),
      );

      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            console.log(`Redis reconnection attempt ${retries}`);
            return Math.min(retries * 50, 1000);
          },
        },
      });

      // Handle connection events
      this.client.on("connect", () => {
        console.log("✅ Redis client connected");
      });

      this.client.on("ready", () => {
        console.log("✅ Redis client ready");
        this.isConnected = true;
      });

      this.client.on("error", (err) => {
        console.error("❌ Redis client error:", err);
        this.isConnected = false;
      });

      this.client.on("end", () => {
        console.log("Redis client disconnected");
        this.isConnected = false;
      });
    } catch (error) {
      console.error("Failed to initialize Redis client:", error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.client) {
      throw new Error("Redis client not initialized");
    }

    if (this.isConnected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.client
      .connect()
      .then(() => {
        console.log("✅ Redis connected successfully");
        this.isConnected = true;
        this.connectionPromise = null;
      })
      .catch((error) => {
        console.error("❌ Redis connection failed:", error);
        this.connectionPromise = null;
        throw error;
      });

    return this.connectionPromise;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client!.ping();
      console.log("Redis ping result:", result);
      return result === "PONG";
    } catch (error) {
      console.error("Redis connection test failed:", error);
      return false;
    }
  }

  async hset(key: string, data: Record<string, any>): Promise<number> {
    try {
      await this.ensureConnection();
      console.log("Redis HSET:", key, Object.keys(data));
      return await this.client!.hSet(key, data);
    } catch (error) {
      console.error("Redis HSET error:", error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      await this.ensureConnection();
      const result = await this.client!.hGetAll(key);
      return result;
    } catch (error) {
      console.error("Redis HGETALL error:", error);
      return {};
    }
  }

  async del(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      console.log("Redis DEL:", key);
      return await this.client!.del(key);
    } catch (error) {
      console.error("Redis DEL error:", error);
      return 0;
    }
  }

  async lpush(key: string, value: string): Promise<number> {
    try {
      await this.ensureConnection();
      console.log("Redis LPUSH:", key, value);
      return await this.client!.lPush(key, value);
    } catch (error) {
      console.error("Redis LPUSH error:", error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      await this.ensureConnection();
      const result = await this.client!.lRange(key, start, stop);
      console.log("Redis LRANGE:", key, "->", result.length, "items");
      return result;
    } catch (error) {
      console.error("Redis LRANGE error:", error);
      return [];
    }
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    try {
      await this.ensureConnection();
      console.log("Redis LREM:", key, count, value);
      return await this.client!.lRem(key, count, value);
    } catch (error) {
      console.error("Redis LREM error:", error);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      await this.ensureConnection();
      return await this.client!.exists(key);
    } catch (error) {
      console.error("Redis EXISTS error:", error);
      return 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      await this.ensureConnection();
      const result = await this.client!.keys(pattern);
      console.log("Redis KEYS:", pattern, "->", result.length, "keys");
      return result;
    } catch (error) {
      console.error("Redis KEYS error:", error);
      return [];
    }
  }

  async ping(): Promise<string> {
    try {
      await this.ensureConnection();
      return await this.client!.ping();
    } catch (error) {
      console.error("Redis PING error:", error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      clientInitialized: !!this.client,
      redisUrl: process.env.REDIS_URL ? "Set" : "Not set",
      clientType: "Standard Redis Client",
    };
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

export const redis = new RedisClient();

// Redis key patterns
export const REDIS_KEYS = {
  AUDIO_PREFIX: "audio:",
  AUDIO_LIST: "audio:list",
  AUDIO_SEARCH: "audio:search:",
} as const;
