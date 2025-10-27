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

  // Initialize PostHog once on mount
  useEffect(() => {
    if (!isLoaded) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey || !posthogHost) {
      console.warn('PostHog environment variables not configured');
      return;
    }

    // Initialize PostHog only once, starting in opted-out state
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        // Start with capturing disabled by default (privacy-first)
        opt_out_capturing_by_default: true,
        // Start with memory-only persistence
        persistence: 'memory',
        // Disable features until consent is given
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
      });
    }
  }, [isLoaded]);

  // Handle consent changes separately
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !posthog.__loaded) return;

    if (consent === 'accepted') {
      // User accepted cookies - enable tracking
      posthog.opt_in_capturing();
      posthog.set_config({ persistence: 'localStorage+cookie' });
      posthog.set_config({ autocapture: true });
      posthog.set_config({ capture_pageleave: true });
    } else if (consent === 'rejected') {
      // User rejected cookies - disable tracking and clear data
      posthog.opt_out_capturing();
      posthog.set_config({ persistence: 'memory' });
      posthog.reset();
    }
    // If consent is null (no decision yet), PostHog remains opted out by default
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
