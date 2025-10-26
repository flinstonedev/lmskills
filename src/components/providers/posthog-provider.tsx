'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useCookieConsent } from '@/hooks/use-cookie-consent';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent, isLoaded } = useCookieConsent();

  useEffect(() => {
    if (!isLoaded || consent !== 'accepted') return;

    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, consent, isLoaded]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { consent, isLoaded } = useCookieConsent();

  // Initialize PostHog
  useEffect(() => {
    if (!isLoaded) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey || !posthogHost) {
      console.warn('PostHog environment variables not configured');
      return;
    }

    // Initialize PostHog with consent-based persistence
    if (typeof window !== 'undefined') {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        // Disable persistence until consent is given
        persistence: consent === 'accepted' ? 'localStorage+cookie' : 'memory',
        // Disable autocapture until consent is given
        autocapture: consent === 'accepted',
        // Capture pageviews manually
        capture_pageview: false,
        // Capture pageleave events
        capture_pageleave: consent === 'accepted',
        // Disable session recording by default (can be enabled later if needed)
        disable_session_recording: true,
      });

      // Opt out if consent was rejected
      if (consent === 'rejected') {
        posthog.opt_out_capturing();
      } else if (consent === 'accepted') {
        posthog.opt_in_capturing();
      }
    }
  }, [consent, isLoaded]);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
