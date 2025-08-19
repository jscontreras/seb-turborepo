import { createHandle } from "flags/sveltekit";
import { FLAGS_SECRET } from "$env/static/private";
import * as flags from "$lib/flags";
import { redirect } from "@sveltejs/kit";

// Create the handle for feature flags
const featureFlagsHandle = createHandle({ secret: FLAGS_SECRET, flags });

// Wrap the feature flags handle to add custom headers
export const handle = async ({ event, resolve }) => {

  // Add to locals
  const geo = {
    country: decodeURIComponent(
      event.request.headers.get("x-vercel-ip-country") || "Country?",
    ),
    city: decodeURIComponent(
      event.request.headers.get("x-vercel-ip-city") || "City?",
    ),
    zipcode: decodeURIComponent(
      event.request.headers.get("x-vercel-ip-postal-code") || "Zipcode?",
    ),
  };
  event.locals.geo = geo;
  console.log(">>>>HOOKS_SERVER_SVELTEKIT", geo);

  // Use the feature flags handle to process the request
  const response = await featureFlagsHandle({ event, resolve });
  // Set the Content-Security-Policy header
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.tc-vercel.dev http://localhost:3000;",
  );

  return response;
};
