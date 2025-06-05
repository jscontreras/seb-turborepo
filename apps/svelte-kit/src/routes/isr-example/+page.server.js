import { BYPASS_TOKEN } from '$env/static/private';

const expirationInSeconds = 30;

export const config = {
  runtime: 'nodejs22.x',
  isr: {
    expiration: 60,
    bypassToken: process.env.BYPASS_TOKEN,
    allowQuery: ['search', 'filter', 'sort']
  }
};

export const load = async ({ url }) => {
  const now = new Date().toISOString();
  const queryParams = Object.fromEntries(url.searchParams);

  return {
    now,
    revalidate: 10,
    queryParams
  };
};

