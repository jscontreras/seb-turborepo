import { BYPASS_TOKEN } from '$env/static/private';

export const config = {
  isr: {
    expiration: 60,
    bypassToken: BYPASS_TOKEN,
    allowQuery: ['search']
  }
};
export const load = async () => {
  const now = new Date().toISOString();
  return {
    now,
    revalidate: 10
  };
};

