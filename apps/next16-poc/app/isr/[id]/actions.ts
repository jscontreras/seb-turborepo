'use server';

import { cacheTag, revalidatePath, revalidateTag } from "next/cache";

export async function revalidateByPath(id: string) {
  revalidatePath(`/isr/${id}`);
}

export async function revalidateDateTag() {
  revalidateTag(`isr-date-fetch`, "max");
}

export async function revalidateLoremParams(id: string) {
  revalidateTag(`isr-lorem-${id.toString()}`, "max");
}

export async function revalidateLoremSeconds(seconds: number) {
  revalidateTag(`isr-lorem-${seconds.toString()}`, "max");
}

export async function revalidateByPageTag(id: string) {
  revalidateTag(`isr-page-${id.toString()}`, "max");
}

export async function getLoremData(id: number) {
  // Instead of unstable_cache we use use cache to cache the data
  'use cache';
  cacheTag(`isr-lorem-${id.toString()}`);
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  const data = (await res.json()) as { title: string; body: string };
  const words = data.body.split(' ');
  // Get 3 random words from the body
  const randomWords = [];
  const usedIndexes = new Set();
  while (randomWords.length < 3 && words.length > 0) {
    const idx = Math.floor(Math.random() * words.length);
    if (!usedIndexes.has(idx)) {
      randomWords.push(words[idx]);
      usedIndexes.add(idx);
    }
  }
  // Append them to the body separated by spaces
  data.body = data.body + ' ' + randomWords.join(' ');
  data.title = data.title.substring(0, 15);
  return data;
}