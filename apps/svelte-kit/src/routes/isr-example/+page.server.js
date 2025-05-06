export const load = async () => {
  const now = new Date().toISOString();
  return {
    now,
    revalidate: 10
  };
};