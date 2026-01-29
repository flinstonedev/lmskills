'use client';

import { useSyncExternalStore } from 'react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export type CookieConsentValue = 'accepted' | 'rejected' | null;

type Listener = () => void;

const consentListeners = new Set<Listener>();
function emitConsentChange() {
  for (const l of consentListeners) l();
}

function readConsentFromStorage(): CookieConsentValue {
  if (typeof window === 'undefined') return null;
  try {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (storedConsent === 'accepted' || storedConsent === 'rejected') {
      return storedConsent;
    }
    return null;
  } catch {
    return null;
  }
}

function subscribeConsent(listener: Listener) {
  consentListeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === COOKIE_CONSENT_KEY) listener();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    consentListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

let hydrated = false;
const hydrationListeners = new Set<Listener>();
function subscribeHydration(listener: Listener) {
  hydrationListeners.add(listener);
  if (!hydrated && typeof window !== 'undefined') {
    queueMicrotask(() => {
      hydrated = true;
      for (const l of hydrationListeners) l();
    });
  }
  return () => {
    hydrationListeners.delete(listener);
  };
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    readConsentFromStorage,
    () => null
  );
  const isLoaded = useSyncExternalStore(
    subscribeHydration,
    () => hydrated,
    () => false
  );

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    emitConsentChange();
    // PostHog tracking is handled by PostHogProvider useEffect
  };

  const rejectCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    emitConsentChange();
    // PostHog opt-out is handled by PostHogProvider useEffect
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    emitConsentChange();
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
