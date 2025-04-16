import { svelteColor } from "$lib/flags";

export async function load({locals}) {
  const { geo } = locals as any;
  const color = await svelteColor();
  return {
    // Requests the feature flag and returns its value
    svelteColor: color,
    geo
  };
}
