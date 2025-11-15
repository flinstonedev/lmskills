'use client';

import { useState } from 'react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export type CookieConsentValue = 'accepted' | 'rejected' | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentValue>(() => {
    // Initialize consent from localStorage
    if (typeof window === 'undefined') return null;
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent === 'accepted' || storedConsent === 'rejected') {
      return storedConsent;
    }
    return null;
  });
  const isLoaded = typeof window !== 'undefined';

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setConsent('accepted');
    // PostHog tracking is handled by PostHogProvider useEffect
  };

  const rejectCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setConsent('rejected');
    // PostHog opt-out is handled by PostHogProvider useEffect
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setConsent(null);
    // PostHog reset is handled by PostHogProvider useEffect
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
