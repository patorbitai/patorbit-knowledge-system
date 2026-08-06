import {
  ResumeCompletionWidget,
  TrustWidget,
  VerificationWidget,
  PassportWidget,
  CareerInsightsWidget,
  ActivityWidget,
  QuickActionsWidget,
} from "@/components/hub/widgets";

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your professional identity at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResumeCompletionWidget />
        <TrustWidget />
        <VerificationWidget />
        <PassportWidget />
        <CareerInsightsWidget />
        <ActivityWidget />
        <QuickActionsWidget />
      </div>
    </div>
  );
}
