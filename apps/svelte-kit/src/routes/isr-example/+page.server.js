import { BYPASS_TOKEN } from '$env/static/private';

const expirationInSeconds = 30;

export const config = {
  isr: {
    expiration: expirationInSeconds,
    bypassToken: BYPASS_TOKEN,
    allowQuery: ['search']
  }
};
export const load = async () => {
  const now = new Date().toISOString();
  return {
    now,
    revalidate: expirationInSeconds
  };
};

