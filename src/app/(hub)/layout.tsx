import AppShell from "@/components/hub/AppShell";
import IdentityPipelineBootstrap from "@/components/identity/IdentityPipelineBootstrap";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <IdentityPipelineBootstrap />
      {children}
    </AppShell>
  );
}
