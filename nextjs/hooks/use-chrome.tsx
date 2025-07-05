import * as React from "react";

export function useIsChrome() {
  const [isChrome, setIsChrome] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    // Check if the browser is Chrome
    const userAgent = window.navigator.userAgent;
    const isChromeBrowser =
      /Chrome/.test(userAgent) && /Google Inc/.test(window.navigator.vendor);
    setIsChrome(isChromeBrowser);
  }, []);

  return !!isChrome;
}
