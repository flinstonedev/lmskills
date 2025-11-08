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
    // Track pageviews for all users unless they explicitly rejected
    if (!isLoaded || consent === 'rejected') return;

    if (pathname && typeof window !== 'undefined' && posthog.__loaded) {
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

    // Initialize PostHog only once with anonymous tracking enabled
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        // Enable basic anonymous tracking by default
        opt_out_capturing_by_default: false,
        // Start with memory-only persistence (no cookies until consent)
        persistence: 'memory',
        // Enable basic tracking features
        autocapture: false, // Keep autocapture off for privacy
        capture_pageview: false, // We manually capture pageviews
        capture_pageleave: true,
        // Disable intrusive features until consent
        disable_session_recording: true,
      });
    }
  }, [isLoaded]);

  // Handle consent changes separately
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !posthog.__loaded) return;

    if (consent === 'accepted') {
      // User accepted cookies - enable full tracking with persistence
      posthog.set_config({ persistence: 'localStorage+cookie' });
      posthog.set_config({ autocapture: true });
    } else if (consent === 'rejected') {
      // User rejected cookies - disable tracking and clear data
      posthog.opt_out_capturing();
      posthog.set_config({ persistence: 'memory' });
      posthog.reset();
    }
    // If consent is null (no decision yet), continue with anonymous tracking in memory
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
