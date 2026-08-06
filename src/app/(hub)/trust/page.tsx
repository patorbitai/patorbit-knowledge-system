import { ShieldCheck } from "lucide-react";
import ComingSoon from "@/components/hub/ComingSoon";

export default function TrustPage() {
  return (
    <ComingSoon
      title="Trust"
      description="Understand and grow how trustworthy your professional profile is — backed by verifiable claims and evidence."
      icon={ShieldCheck}
      capabilities={[
        "Trust Score",
        "Credential Verification",
        "Evidence Explorer",
        "Trust Timeline",
      ]}
    />
  );
}
