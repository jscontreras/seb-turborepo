-- Redis Setup Information using HTTP-based client
-- This script documents the Redis data structure used for the audio library

-- Environment Variable Options:
-- Option 1: HTTP-based Redis (like Upstash)
-- REDIS_URL=https://your-redis-endpoint.upstash.io

-- Option 2: Standard Redis (will use in-memory fallback)
-- REDIS_URL=redis://localhost:6379

-- The client automatically detects the protocol and uses appropriate method:
-- - HTTP/HTTPS: Uses fetch-based requests
-- - Redis protocol: Falls back to in-memory storage for compatibility

-- Redis Keys Structure:
-- audio:{id} - Hash containing audio metadata
-- audio:list - List of audio IDs (for ordering)

-- Example Redis Commands for testing:
-- PING
-- HGETALL audio:123e4567-e89b-12d3-a456-426614174000
-- LRANGE audio:list 0 -1
-- HSET audio:123e4567-e89b-12d3-a456-426614174000 title "New Title"
-- KEYS audio:*

-- Audio metadata hash structure:
-- id: unique identifier
-- filename: original filename
-- title: user-defined title
-- url: blob storage URL
-- downloadUrl: download URL
-- uploadDate: ISO timestamp
-- size: file size in bytes (stored as string)

SELECT 'HTTP-based Redis Client Configuration:' as info;
SELECT 'REDIS_URL environment variable required' as requirement;
SELECT 'Supports both HTTP Redis and standard Redis with fallback' as compatibility;
SELECT 'Uses in-memory storage when Redis is unavailable' as fallback;
SELECT 'Optimized for serverless and edge environments' as optimization;
