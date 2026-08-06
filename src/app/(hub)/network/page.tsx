import { Network } from "lucide-react";
import ComingSoon from "@/components/hub/ComingSoon";

export default function NetworkPage() {
  return (
    <ComingSoon
      title="Network"
      description="Visualize your professional relationships, journey, and applications in one place."
      icon={Network}
      capabilities={["Knowledge Graph", "Career Journey", "Applications"]}
    />
  );
}
