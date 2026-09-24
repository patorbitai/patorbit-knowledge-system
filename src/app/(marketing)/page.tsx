/**
 * Root `/` renders the canonical landing page directly (no redirect hop).
 * The same page is also served at `/home`; metadata canonical points at the
 * root URL.
 */
export { default, metadata } from "./home/page";
