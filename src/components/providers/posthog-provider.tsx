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
    // Opt-out model: Track pageviews unless user explicitly rejected
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

    // Initialize PostHog only once with full tracking enabled (opt-out model)
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        // Opt-out model: tracking enabled by default
        opt_out_capturing_by_default: false,
        // Full persistence enabled by default (will be adjusted if user rejected)
        persistence: 'localStorage+cookie',
        // Enable tracking features by default
        autocapture: true,
        capture_pageview: false, // We manually capture pageviews
        capture_pageleave: true,
        // Session recording still disabled
        disable_session_recording: true,
      });
    }
  }, [isLoaded]);

  // Handle consent changes when user explicitly rejects
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !posthog.__loaded) return;

    if (consent === 'rejected') {
      // User explicitly rejected cookies - disable tracking and clear data
      posthog.opt_out_capturing();
      posthog.set_config({ persistence: 'memory' });
      posthog.set_config({ autocapture: false });
      posthog.reset();
    }
    // For null (no decision) and 'accepted', tracking is already enabled by default
    // Only need to act when user switches from rejected back to accepted
    else if (consent === 'accepted') {
      posthog.opt_in_capturing();
      posthog.set_config({ persistence: 'localStorage+cookie' });
      posthog.set_config({ autocapture: true });
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
