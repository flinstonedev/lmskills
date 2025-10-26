import posthog from 'posthog-js';

/**
 * Track a custom event with PostHog
 * Only tracks if user has accepted cookies and PostHog is initialized
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Identify a user with PostHog
 * Call this after user signs in or when user data is available
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, traits);
  }
}

/**
 * Reset PostHog user identity
 * Call this when user signs out
 */
export function resetUser() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset();
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.setPersonProperties(properties);
  }
}
