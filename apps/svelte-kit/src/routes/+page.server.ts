import { svelteColor } from "$lib/flags";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const color = await svelteColor();
  const queryParams = Object.fromEntries(url.searchParams);

  return {
    // Requests the feature flag and returns its value
    svelteColor: color,
    geo: locals.geo,
    queryParams,
  };
};
