"use server";

import { put, del, list } from "@vercel/blob";
import { redis, REDIS_KEYS } from "@/lib/redis";

interface AudioMetadata {
  id: string;
  filename: string;
  title: string;
  url: string;
  downloadUrl: string;
  uploadDate: string;
  size: number;
}

export async function uploadAudio(formData: FormData) {
  const file = formData.get("audio") as File;
  const title = formData.get("title") as string;

  if (!file || !title) {
    throw new Error("File and title are required");
  }

  // Validate file type
  if (!file.type.startsWith("audio/")) {
    throw new Error("Please upload a valid audio file");
  }

  const id = crypto.randomUUID();
  const uploadDate = new Date().toISOString();

  try {
    console.log(
      "Starting upload for file:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type,
    );

    // Test Redis connection first
    const connectionTest = await redis.testConnection();
    const connectionStatus = redis.getConnectionStatus();
    console.log("Redis connection status:", connectionStatus);

    if (!connectionTest) {
      console.error("❌ Redis connection failed - data will not persist!");
      throw new Error(
        "Database connection failed. Please check your Redis configuration.",
      );
    }

    // Upload to Vercel Blob with the original filename
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Use the exact URLs returned by Vercel
    const audioMetadata: AudioMetadata = {
      id,
      filename: file.name,
      title: title.trim(),
      url: blob.url,
      downloadUrl:
        blob.downloadUrl.replace("?download=1", "") ||
        blob.url.replace("?download=1", ""),
      uploadDate,
      size: file.size,
    };

    // Store metadata in Redis
    console.log("Storing metadata in Redis...");
    await redis.hset(`${REDIS_KEYS.AUDIO_PREFIX}${id}`, {
      id: audioMetadata.id,
      filename: audioMetadata.filename,
      title: audioMetadata.title,
      url: audioMetadata.url,
      downloadUrl: audioMetadata.downloadUrl,
      uploadDate: audioMetadata.uploadDate,
      size: audioMetadata.size.toString(),
      blobPathname: blob.pathname,
    });

    // Add to the list of audio IDs (for ordering)
    await redis.lpush(REDIS_KEYS.AUDIO_LIST, id);

    console.log("✅ Audio metadata stored successfully in Redis");

    // Verify the data was actually stored
    const verification = await redis.hgetall(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);
    console.log(
      "✅ Verification - data stored:",
      Object.keys(verification).length > 0,
    );

    if (Object.keys(verification).length === 0) {
      throw new Error("Failed to verify data storage in Redis");
    }

    return audioMetadata;
  } catch (error) {
    console.error("❌ Error uploading audio:", error);
    throw new Error(
      `Failed to upload audio file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function deleteAudio(id: string) {
  try {
    // Get audio metadata from Redis
    const audioData = await redis.hgetall(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);

    if (!audioData || Object.keys(audioData).length === 0) {
      throw new Error("Audio not found");
    }

    console.log("Deleting audio:", audioData);

    // Delete from Vercel Blob using the stored URL
    if (audioData.url) {
      try {
        await del(audioData.url as string);
        console.log("✅ Blob deleted successfully");
      } catch (error) {
        console.error("Error deleting blob:", error);
        // Continue with Redis cleanup even if blob deletion fails
      }
    }

    // Remove from Redis
    await redis.del(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);

    // Remove from the list
    await redis.lrem(REDIS_KEYS.AUDIO_LIST, 0, id);

    console.log("✅ Audio deleted successfully:", id);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting audio:", error);
    throw new Error("Failed to delete audio file");
  }
}

export async function getAllAudios(): Promise<AudioMetadata[]> {
  try {
    console.log("Fetching all audios from Redis...");

    // Test Redis connection
    const connectionStatus = redis.getConnectionStatus();
    console.log("Redis connection status:", connectionStatus);

    // Test connection
    const pingResult = await redis.ping();
    console.log("Redis ping result:", pingResult);

    // Get all audio IDs from the list
    const audioIds = await redis.lrange(REDIS_KEYS.AUDIO_LIST, 0, -1);
    console.log("Found audio IDs:", audioIds);

    if (!audioIds || audioIds.length === 0) {
      console.log("No audio files found in Redis");
      return [];
    }

    // Get metadata for each audio file
    const audios: AudioMetadata[] = [];

    for (const id of audioIds) {
      try {
        const audioData = await redis.hgetall(
          `${REDIS_KEYS.AUDIO_PREFIX}${id}`,
        );
        console.log(`Audio data for ${id}:`, audioData);

        if (audioData && Object.keys(audioData).length > 0) {
          // Ensure all required fields are present and valid
          const audio: AudioMetadata = {
            id: audioData.id || id,
            filename: audioData.filename || "Unknown",
            title: audioData.title || "Untitled",
            url: audioData.url || "",
            downloadUrl: audioData.downloadUrl || audioData.url || "",
            uploadDate: audioData.uploadDate || new Date().toISOString(),
            size: Number(audioData.size) || 0,
          };

          // Validate that the URL exists
          if (audio.url) {
            audios.push(audio);
          } else {
            console.warn(`Audio ${id} has no valid URL, skipping`);
          }
        } else {
          console.warn(`No data found for audio ${id}`);
        }
      } catch (error) {
        console.error(`Error fetching audio ${id}:`, error);
        // Continue with other files if one fails
      }
    }

    console.log("✅ Processed audios:", audios.length);

    // Sort by upload date (newest first)
    return audios.sort((a, b) => {
      try {
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      } catch (error) {
        return 0;
      }
    });
  } catch (error) {
    console.error("❌ Error getting all audios:", error);
    throw new Error(
      `Failed to load audio files: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function searchAudios(query: string): Promise<AudioMetadata[]> {
  if (!query.trim()) {
    return getAllAudios();
  }

  try {
    const allAudios = await getAllAudios();
    const searchTerms = query
      .toLowerCase()
      .split(" ")
      .filter((term) => term.length > 0);

    return allAudios.filter((audio) => {
      const searchableText = `${audio.title} ${audio.filename}`.toLowerCase();
      return searchTerms.some((term) => searchableText.includes(term));
    });
  } catch (error) {
    console.error("Error searching audios:", error);
    return [];
  }
}

export async function updateAudioTitle(
  id: string,
  newTitle: string,
): Promise<AudioMetadata> {
  try {
    const audioData = await redis.hgetall(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);

    if (!audioData || Object.keys(audioData).length === 0) {
      throw new Error("Audio not found");
    }

    // Update the title
    await redis.hset(`${REDIS_KEYS.AUDIO_PREFIX}${id}`, {
      title: newTitle.trim(),
    });

    // Return updated metadata
    const updatedData = await redis.hgetall(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);

    return {
      id: updatedData.id as string,
      filename: updatedData.filename as string,
      title: updatedData.title as string,
      url: updatedData.url as string,
      downloadUrl: updatedData.downloadUrl as string,
      uploadDate: updatedData.uploadDate as string,
      size: Number(updatedData.size) || 0,
    };
  } catch (error) {
    console.error("Error updating audio title:", error);
    throw new Error("Failed to update audio title");
  }
}

export async function getAudioStats() {
  try {
    const audioIds = await redis.lrange(REDIS_KEYS.AUDIO_LIST, 0, -1);
    let totalSize = 0;

    for (const id of audioIds) {
      try {
        const audioData = await redis.hgetall(
          `${REDIS_KEYS.AUDIO_PREFIX}${id}`,
        );
        if (audioData && audioData.size) {
          totalSize += Number(audioData.size) || 0;
        }
      } catch (error) {
        console.error(`Error getting stats for audio ${id}:`, error);
      }
    }

    return {
      totalFiles: audioIds.length,
      totalSize,
    };
  } catch (error) {
    console.error("Error getting audio stats:", error);
    return {
      totalFiles: 0,
      totalSize: 0,
    };
  }
}

export async function testBlobUrl(url: string) {
  try {
    console.log("Testing blob URL:", url);

    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-cache",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: url,
    };

    console.log("URL test result:", result);
    return result;
  } catch (error) {
    console.error("URL test error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      url: url,
    };
  }
}

export async function getRedisConnectionInfo() {
  try {
    const connectionStatus = redis.getConnectionStatus();

    // Test the connection
    const pingResult = await redis.ping();
    const connectionTest = await redis.testConnection();

    // Get some basic stats
    const audioIds = await redis.lrange(REDIS_KEYS.AUDIO_LIST, 0, -1);

    return {
      ...connectionStatus,
      pingResult,
      connectionTest,
      redisUrl: process.env.REDIS_URL ? "Set" : "Not set",
      audioCount: audioIds.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      redisUrl: process.env.REDIS_URL ? "Set" : "Not set",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function listAllBlobs() {
  try {
    const { blobs } = await list();
    console.log("All blobs in storage:", blobs);
    return blobs.map((blob) => ({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
  } catch (error) {
    console.error("Error listing blobs:", error);
    return [];
  }
}

export async function debugBlobStorage() {
  try {
    // Get Redis connection info
    const redisInfo = await getRedisConnectionInfo();

    // List all blobs to see what's actually in storage
    const blobs = await listAllBlobs();

    // Get all audio metadata from Redis
    const audioIds = await redis.lrange(REDIS_KEYS.AUDIO_LIST, 0, -1);
    const redisData = [];

    for (const id of audioIds) {
      const audioData = await redis.hgetall(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);
      redisData.push({ id, ...audioData });
    }

    // Compare URLs between blobs and Redis
    const urlComparison = redisData.map((redis) => {
      const redisUrl = (redis as any).url;
      const redisDownloadUrl = (redis as any).downloadUrl;
      const redisBlobPathname = (redis as any).blobPathname;

      const matchingBlob = blobs.find(
        (blob) =>
          blob.url === redisUrl ||
          blob.downloadUrl === redisDownloadUrl ||
          blob.pathname === redisBlobPathname,
      );

      return {
        redisId: redis.id,
        redisUrl: redisUrl,
        redisDownloadUrl: redisDownloadUrl,
        blobExists: !!matchingBlob,
        matchingBlobUrl: matchingBlob?.url,
        matchingBlobDownloadUrl: matchingBlob?.downloadUrl,
      };
    });

    return {
      redisInfo,
      blobCount: blobs.length,
      blobs: blobs,
      redisCount: redisData.length,
      redisData: redisData,
      urlComparison: urlComparison,
      mismatchedUrls: urlComparison.filter((comp) => !comp.blobExists),
    };
  } catch (error) {
    console.error("Debug error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function syncBlobUrls() {
  try {
    // Get all blobs from Vercel
    const blobs = await listAllBlobs();

    // Get all audio IDs from Redis
    const audioIds = await redis.lrange(REDIS_KEYS.AUDIO_LIST, 0, -1);

    let syncedCount = 0;

    for (const id of audioIds) {
      const audioData = await redis.hgetall(`${REDIS_KEYS.AUDIO_PREFIX}${id}`);

      if (audioData && audioData.blobPathname) {
        // Find matching blob by pathname
        const matchingBlob = blobs.find(
          (blob) => blob.pathname === audioData.blobPathname,
        );

        if (matchingBlob && matchingBlob.url !== audioData.url) {
          // Update Redis with correct URLs
          await redis.hset(`${REDIS_KEYS.AUDIO_PREFIX}${id}`, {
            url: matchingBlob.url,
            downloadUrl: matchingBlob.downloadUrl || matchingBlob.url,
          });

          console.log(`Synced URLs for ${id}:`, {
            old: audioData.url,
            new: matchingBlob.url,
          });

          syncedCount++;
        }
      }
    }

    return {
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} audio file URLs`,
    };
  } catch (error) {
    console.error("Sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
