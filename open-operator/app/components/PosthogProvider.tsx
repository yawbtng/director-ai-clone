"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    try {
      if (
        !process.env.NEXT_PUBLIC_POSTHOG_KEY ||
        !process.env.NEXT_PUBLIC_POSTHOG_HOST
      )
        return;
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "always",
      });
    } catch (e) {
      console.error(e);
    }
  }, [isClient]);

  // Don't render PostHog provider until client-side
  if (!isClient) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
