# Analytics & Tracking Documentation

This document explains how analytics and tracking work in LMSkills.

## Overview

LMSkills uses [PostHog](https://posthog.com) for product analytics to understand how users interact with the platform. Our tracking implementation prioritizes user privacy while providing valuable insights.

## Tracking Approach

### Anonymous Tracking by Default

We implement **anonymous tracking by default** with opt-in for enhanced features:

- ✅ **All users are tracked anonymously** unless they explicitly reject cookies
- ✅ **No persistent cookies** until user accepts cookie consent
- ✅ **No personally identifiable information** collected without consent
- ❌ Users who reject cookies are completely opted out

### Privacy-First Design

Our implementation follows these privacy principles:

1. **Memory-Only Storage**: Anonymous users use memory-only storage (no cookies or localStorage)
2. **Minimal Data Collection**: Only essential events are tracked (pageviews, navigation)
3. **No Intrusive Features**: Session recording and autocapture are disabled by default
4. **Explicit Consent**: Enhanced tracking requires user acceptance via cookie banner

## How It Works

### Initialization

When a user first visits LMSkills:

```javascript
// PostHog initializes with these settings:
{
  opt_out_capturing_by_default: false,        // Enable anonymous tracking
  persistence: 'memory',                      // No cookies/localStorage yet
  autocapture: false,                         // Disable automatic click tracking
  capture_pageview: false,                    // Manual pageview tracking only
  capture_pageleave: true,                    // Track when users leave pages
  disable_session_recording: true,            // No session recording
}
```

### User States

#### 1. **No Cookie Decision (Default)**
- **Tracking**: ✅ Anonymous pageviews and events
- **Storage**: Memory only (cleared on browser close)
- **User Identity**: Anonymous (no persistent ID)
- **Features**: Basic pageview tracking

#### 2. **Cookies Accepted**
- **Tracking**: ✅ Full tracking with persistent identity
- **Storage**: localStorage + cookies
- **User Identity**: Persistent across sessions
- **Features**: Autocapture enabled, user journey tracking

#### 3. **Cookies Rejected**
- **Tracking**: ❌ Completely disabled
- **Storage**: Memory only (cleared immediately)
- **User Identity**: None
- **Features**: All tracking stopped

### What We Track

#### Anonymous Users (Default)
- Page views (`$pageview`)
- Page URLs
- Referrer information
- Basic device/browser information
- Navigation events

#### Users Who Accept Cookies
Everything from anonymous tracking, plus:
- Click events (autocapture)
- User journey mapping
- Persistent user identification
- Session replay (if enabled in future)
- Custom events from user interactions

#### Users Who Reject Cookies
- Nothing - all tracking is disabled

## Cookie Consent Banner

The cookie consent banner appears at the bottom of the screen for new visitors:

- **Accept**: Enables full tracking with persistent storage
- **Reject**: Disables all tracking and clears any stored data
- **No Action**: Continues with anonymous memory-only tracking

## Implementation Details

### PostHog Provider

Location: `src/components/providers/posthog-provider.tsx`

The provider handles:
1. PostHog initialization on mount
2. Cookie consent state management
3. Pageview tracking
4. Storage mode switching based on consent

### Cookie Consent Hook

Location: `src/hooks/use-cookie-consent.ts`

Manages user's cookie preference:
- Stores consent in localStorage
- Provides current consent state
- Triggers PostHog configuration updates

### Pageview Tracking

```typescript
// Tracks pageviews for all users unless explicitly rejected
if (!isLoaded || consent === 'rejected') return;

posthog.capture('$pageview', {
  $current_url: url,
});
```

## Data Retention

- **Anonymous users**: Data cleared when browser closes (memory only)
- **Accepted cookies**: Data persisted according to PostHog retention policy
- **Rejected cookies**: All data immediately cleared

## GDPR/CCPA Compliance

Our implementation is designed to be privacy-law compliant:

✅ **Transparent**: Users are informed via cookie banner
✅ **Controlled**: Users can accept, reject, or ignore
✅ **Respectful**: Rejection completely disables tracking
✅ **Minimal**: Only essential data collected by default
✅ **Secure**: Data handled by PostHog (EU-hosted)

## PostHog Configuration

### Environment Variables

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### Host Region

We use PostHog's EU region (`eu.i.posthog.com`) for GDPR compliance.

## Testing Tracking

### Verify PostHog is Working

1. Open browser DevTools (Network tab)
2. Visit any page on LMSkills
3. Look for requests to `eu.i.posthog.com/e/` or `eu.i.posthog.com/i/v0/e/`
4. These are event ingestion requests

### Check Console

PostHog loads its config from:
```
https://eu-assets.i.posthog.com/array/phc_kwRgN4BgVp01EAKv04GEFHlu9DeOV9omfgFqNrrQNUK/config.js
```

### Verify Cookie Consent

1. Open browser console
2. Check localStorage for `cookieConsent` key
3. Values: `'accepted'`, `'rejected'`, or `null` (no decision)

## Troubleshooting

### No Events in PostHog

**Possible causes:**
- Cookie consent is rejected
- PostHog environment variables not configured
- Ad blocker blocking PostHog requests
- PostHog project key incorrect

**Solution:**
1. Check browser console for PostHog errors
2. Verify environment variables are set
3. Check Network tab for blocked requests
4. Clear cookies and localStorage, reload page

### Events Not Persisting

**Cause:** User hasn't accepted cookies (anonymous mode)

**Solution:** This is expected behavior. Events are tracked but user identity is anonymous and not persisted.

### Double Events

**Cause:** PostHog may be initialized twice in development

**Solution:** Normal in development with hot reload. Not an issue in production.

## Future Considerations

### Potential Enhancements

1. **Session Recording**: Could enable for users who accept cookies (currently disabled)
2. **Heatmaps**: PostHog supports heatmaps for understanding UI interactions
3. **Feature Flags**: Use PostHog for A/B testing and feature rollouts
4. **Funnel Analysis**: Track conversion funnels for skill submissions
5. **User Surveys**: In-app surveys for feedback collection

### Privacy Improvements

1. **Granular Consent**: Separate consent for different tracking levels
2. **Cookie Policy Page**: Detailed explanation of all cookies used
3. **Data Export**: Allow users to export their tracked data
4. **Right to Deletion**: Implement data deletion requests

## Contact

For questions about tracking or privacy:
- Review `src/app/privacy/page.tsx` for privacy policy
- Check `src/components/cookie-consent-banner.tsx` for consent implementation
- See `src/components/providers/posthog-provider.tsx` for tracking logic

---

**Last Updated**: November 8, 2025
**PostHog Version**: 1.280.1
**Implementation**: Anonymous tracking with opt-in enhancements

