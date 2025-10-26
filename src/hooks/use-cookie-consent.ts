'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export type CookieConsentValue = 'accepted' | 'rejected' | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentValue>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Read consent from localStorage on mount
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent === 'accepted' || storedConsent === 'rejected') {
      setConsent(storedConsent);
    }
    setIsLoaded(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsent('accepted');

    // Enable PostHog tracking
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.opt_in_capturing();
      // Switch to persistent storage
      posthog.set_config({ persistence: 'localStorage+cookie' });
      posthog.set_config({ autocapture: true });
      posthog.set_config({ capture_pageleave: true });
    }
  };

  const rejectCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setConsent('rejected');

    // Disable PostHog tracking
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.opt_out_capturing();
      // Clear any stored data
      posthog.reset();
    }
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setConsent(null);

    // Reset PostHog
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.reset();
    }
  };

  return {
    consent,
    isLoaded,
    acceptCookies,
    rejectCookies,
    resetConsent,
    showBanner: isLoaded && consent === null,
  };
}
