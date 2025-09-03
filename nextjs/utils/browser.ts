export const isSupportedBrowser = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
  const isEdge = userAgent.includes('edg');
  
  return isChrome || isEdge;
};

export const getBrowserName = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) return 'Firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
  if (userAgent.includes('edg')) return 'Edge';
  if (userAgent.includes('chrome')) return 'Chrome';
  if (userAgent.includes('opera')) return 'Opera';
  
  return 'Unknown';
};