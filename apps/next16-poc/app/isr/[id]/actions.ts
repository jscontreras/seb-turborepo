'use server';

import { revalidatePath, revalidateTag } from "next/cache";

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