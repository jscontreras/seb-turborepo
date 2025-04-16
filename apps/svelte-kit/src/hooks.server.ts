import { createHandle } from "@vercel/flags/sveltekit";
import { geolocation } from '@vercel/functions';
import { FLAGS_SECRET } from "$env/static/private";
import * as flags from "$lib/flags";

// Create the handle for feature flags
const featureFlagsHandle = createHandle({ secret: FLAGS_SECRET, flags });

// Wrap the feature flags handle to add custom headers
export const handle = async ({ event, resolve }) => {
  // Use the feature flags handle to process the request
  const response = await featureFlagsHandle({ event, resolve });

  const geo = geolocation(event.request);

  // Add to locals
  (event.locals as any).geo = geo;

  // Set the Content-Security-Policy header
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.tc-vercel.dev http://localhost:3000;",
  );

  return response;
};
