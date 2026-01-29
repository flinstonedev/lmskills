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
    // Opt-in model: Only track pageviews when user has explicitly accepted cookies
    if (!isLoaded || consent !== 'accepted') return;

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

    // Initialize PostHog only once with tracking disabled by default (opt-in model)
    // This is GDPR compliant - no tracking until user explicitly consents
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        // Opt-in model: tracking disabled by default until user consents
        opt_out_capturing_by_default: true,
        // Memory-only persistence until consent is given (no cookies/localStorage)
        persistence: 'memory',
        // Disable tracking features by default
        autocapture: false,
        capture_pageview: false, // We manually capture pageviews
        capture_pageleave: false, // Disabled until consent
        // Session recording disabled
        disable_session_recording: true,
      });
    }
  }, [isLoaded]);

  // Handle consent changes
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !posthog.__loaded) return;

    if (consent === 'accepted') {
      // User explicitly accepted cookies - enable full tracking
      posthog.opt_in_capturing();
      posthog.set_config({ persistence: 'localStorage+cookie' });
      posthog.set_config({ autocapture: true });
      posthog.set_config({ capture_pageleave: true });
    } else if (consent === 'rejected') {
      // User explicitly rejected cookies - ensure tracking is disabled
      posthog.opt_out_capturing();
      posthog.set_config({ persistence: 'memory' });
      posthog.set_config({ autocapture: false });
      posthog.set_config({ capture_pageleave: false });
      posthog.reset();
    }
    // For null (no decision yet), tracking remains disabled (opt-in model default)
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
