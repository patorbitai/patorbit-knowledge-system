import { Settings } from "lucide-react";
import ComingSoon from "@/components/hub/ComingSoon";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Manage your account, privacy, and profile preferences."
      icon={Settings}
      capabilities={["Account", "Privacy", "Profile"]}
    />
  );
}
