import { flag } from "flags/sveltekit";

export const svelteColor = flag<boolean>({
  key: "svelteColor",
  description: "Use the Svelte color for the headline", // optional
  options: [{ value: true }, { value: false }], // optional
  // can be async and has access to the headers and cookies
  decide(params) {
    // Very simple example to show how to use the URL to determine the flag.
    // In real live you would probably query an external source such as
    // Vercel Edge Config (https://vercel.com/docs/storage/edge-config)

    // In v4, we need to reconstruct the URL from headers or use a different approach
    // For now, let's check if there's a way to get the URL from headers
    const url =
      params.headers.get("x-url") || params.headers.get("referer") || "";
    const urlObj = url ? new URL(url) : null;

    return urlObj ? urlObj.searchParams.has("svelteColor") : false;
  },
});
