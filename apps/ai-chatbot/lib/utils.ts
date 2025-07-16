import { put } from "@vercel/blob";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function uploadBase64ToVercelBlob(
  base64String: string,
  filename?: string,
): Promise<string | null> {
  try {
    // Extract the data type and base64 content
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 string");
    }

    const mimeType = matches[1];
    const base64Content = matches[2];

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, "base64");

    // Determine file extension from mime type
    const extension = mimeType.split("/")[1];

    // Generate a unique filename if not provided
    const uniqueFilename =
      filename ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, buffer, {
      access: "public",
      contentType: mimeType,
    });

    return blob.url;
  } catch (error) {
    console.error("Error uploading base64 to Vercel Blob:", error);
    return null;
  }
}
