import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Define constants for audience and required scope
const AUTH0_DOMAIN = process.env.VITE_AUTH0_DOMAIN || '';
const JWKS_URL = `https://${AUTH0_DOMAIN}/.well-known/jwks.json`;
const AUDIENCE = process.env.VITE_AUTH0_AUDIENCE || '';
const ISSUER = `https://${AUTH0_DOMAIN}/`; // Auth0 issuer

// Helper function that validates Auth0 token
async function validateToken(token: string) {
  if (!token) {
    throw new Error("Missing Auth Token");
  }

  // Create a JWKS client
  const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['RS256'], // Ensure RS256 is used
  });
  return payload;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(" ")[1] || ""; // Extract the Bearer token

    // At this point the token has been already validated by the Middleware (edge runtime).
    // You can also validate direclty in this function
    await validateToken(token);

    if (!token) {
      throw new Error("Token is missing");
    }

    // Get info from AUTH0
    const userDetails = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }});

    const {name} = await userDetails.json() as any;

    // If all checks pass, return success response
    return response.status(200).json({ message: `Hello ${name}! (via OAUTH protected Vercel Function)` });
  } catch (error: any) {
    return response.status(401).json({ message: error.message });
  }
}