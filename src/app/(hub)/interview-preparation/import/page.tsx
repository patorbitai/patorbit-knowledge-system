import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImportEmailFlow from "@/components/hub/interview/ImportEmailFlow";

export const metadata = {
  title: "Import an interview invitation — Patorbit",
};

export const dynamic = "force-dynamic";

const ERROR_COPY: Record<string, string> = {
  cancelled: "Connection cancelled — nothing was connected.",
  state_mismatch: "The connection could not be verified and was not completed. Please try again.",
  error: "The mailbox connection failed. Paste or upload the email instead.",
};

export default async function ImportInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ mailbox?: string; provider?: string }>;
}) {
  const { mailbox, provider } = await searchParams;
  const connectedProvider = mailbox === "connected" ? provider : undefined;
  const connectionError = mailbox && mailbox !== "connected" ? ERROR_COPY[mailbox] ?? ERROR_COPY.error : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Link
          href="/interview-preparation"
          className="inline-flex items-center gap-1.5 text-label text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Interview Preparation
        </Link>
        <h1 className="mt-2 text-page-title text-ink">Import an interview invitation</h1>
        <p className="mt-1.5 max-w-2xl text-secondary-size text-ink-secondary">
          Paste the email, upload the document, or connect a read-only mailbox. You review and edit
          everything before it is saved.
        </p>
      </div>

      <ImportEmailFlow connectedProvider={connectedProvider} connectionError={connectionError} />
    </div>
  );
}
