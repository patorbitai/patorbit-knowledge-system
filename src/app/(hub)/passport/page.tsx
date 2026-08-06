import { IdCard } from "lucide-react";
import ComingSoon from "@/components/hub/ComingSoon";

export default function PassportPage() {
  return (
    <ComingSoon
      title="Professional Passport"
      description="Package your verified claims and evidence into a shareable, tamper-evident professional passport."
      icon={IdCard}
      capabilities={["Verified claims", "Shareable profile", "Evidence-backed"]}
    />
  );
}
