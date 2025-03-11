
const configJson = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    redirect_uri: window.location.origin,
    scope: import.meta.env.VITE_AUTH0_SCOPE,
  }
}

export function getConfig() {
  return {
    ...configJson
  };
}