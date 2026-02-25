"use server"

import { updateTag } from "next/cache"

export async function revalidateTagsWithUpdateTag(
  tags: string[]
): Promise<{ revalidated: string[] }> {
  for (const tag of tags) {
    updateTag(tag)
  }
  return { revalidated: tags }
}
