import IdentityPipelineBootstrap from "@/components/identity/IdentityPipelineBootstrap";
import WriteBackBootstrap from "@/components/resume-builder/WriteBackBootstrap";

/**
 * Resume Builder App Layout
 *
 * Overrides the parent marketing layout to provide a dedicated
 * full-screen application shell — no SiteHeader, no SiteFooter.
 * This makes the builder feel like a professional productivity
 * tool (Cursor, Linear, Figma) rather than a marketing page.
 *
 * This is a Server Component. It mounts the tiny client-only
 * IdentityPipelineBootstrap to start the automatic trust pipeline
 * for the app's lifetime, without converting the layout to client.
 */

export default function ResumeBuilderAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IdentityPipelineBootstrap />
      <WriteBackBootstrap />
      {children}
    </>
  );
}