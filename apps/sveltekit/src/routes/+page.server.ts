import { svelteColor } from '$lib/flags'

export async function load() {
  const color = await svelteColor();
  return {
    // Requests the feature flag and returns its value
    svelteColor: color,
  }
}
