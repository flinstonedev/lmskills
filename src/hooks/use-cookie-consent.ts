'use client';

import { useEffect, useState } from 'react';

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
  };

  const rejectCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setConsent('rejected');
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setConsent(null);
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
