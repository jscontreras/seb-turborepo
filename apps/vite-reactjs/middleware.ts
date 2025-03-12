import { createRemoteJWKSet, jwtVerify } from "jose";
import { geolocation } from "@vercel/functions";

// Define constants for audience and required scope
const AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN || "";
const JWKS_URL = `https://${AUTH0_DOMAIN}/.well-known/jwks.json`;
const AUDIENCE = process.env.VITE_AUTH0_AUDIENCE || "";
const ISSUER = `https://${AUTH0_DOMAIN}/`; // Auth0 issuer

let instance = false;

// Helper function that validates Auth0 token
async function validateToken(token: string) {
  if (!token) {
    throw new Error("Missing Auth Token [M]");
  }

  // Create a JWKS client
  const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ["RS256"], // Ensure RS256 is used
  });
  return payload;
}

export default async function middleware(request: Request) {
  if (!instance) {
    instance = true;
    const data = geolocation(request);
    console.log("geolocation", data);
  }
  console.log("Middleware: Incoming request!");
  console.log(request.url);
  if (request.url.includes("/api/nodejs/hello-auth")) {
    console.log("Middleware: Validating Auth");
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1] || ""; // Extract the Bearer token
    // Validate token
    try {
      await validateToken(token);
    } catch {
      return new Response(
        JSON.stringify({ message: `Invalid Credentials [M]` }),
        { status: 401 },
      );
    }
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
