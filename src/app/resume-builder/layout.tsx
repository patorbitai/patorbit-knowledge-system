/**
 * Resume Builder App Layout
 *
 * Overrides the parent marketing layout to provide a dedicated
 * full-screen application shell — no SiteHeader, no SiteFooter.
 * This makes the builder feel like a professional productivity
 * tool (Cursor, Linear, Figma) rather than a marketing page.
 */

export default function ResumeBuilderAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
