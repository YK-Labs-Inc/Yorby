"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function Chatwoot() {
  const pathname = usePathname();
  const [shouldShowChatwoot, setShouldShowChatwoot] = useState(false);
  useEffect(() => {
    setShouldShowChatwoot(
      !pathname.includes("sample-resumes") &&
        !pathname.includes("mockInterviews") &&
        !pathname.includes("mock-interviews")
    );
  }, [pathname]);

  useEffect(() => {
    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right", // This can be left or right
      locale: "en", // Language to be set
      type: "expanded_bubble", // [standard, expanded_bubble]
    };
  }, []);

  if (!shouldShowChatwoot) {
    return null;
  }
  return (
    <Script
      id="chatwoot-sdk"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
              (function(d,t) {
                var BASE_URL="https://app.chatwoot.com";
                var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.defer = true;
                g.async = true;
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  window.chatwootSDK.run({
                    websiteToken: 'tkusCe1LHUWQt29UzrA9KdUD',
                    baseUrl: BASE_URL
                  })
                }
              })(document,"script");
            `,
      }}
    />
  );
}
