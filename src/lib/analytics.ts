"use strict";

/**
 * Analytics helper — single swap-point for a real analytics provider.
 *
 * Currently logs to the console in development only. When you integrate
 * PostHog, Segment, Mixpanel, or your own analytics, update ONLY this file:
 *
 *   export function trackEvent(name, properties) {
 *     if (process.env.NODE_ENV === "development") {
 *       console.log("[analytics]", name, properties);
 *     }
 *     posthog.capture(name, properties);
 *     // or analytics.track(name, properties)
 *   }
 */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, properties);
  }

  // Future: posthog.capture(name, properties)
  // Future: analytics.track(name, properties)
}