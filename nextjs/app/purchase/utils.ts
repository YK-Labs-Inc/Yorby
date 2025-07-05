export const isWithin24Hours = (createdAt: string) => {
  const signupDate = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - signupDate.getTime();
  return diff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
};
