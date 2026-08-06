import { Sparkles } from "lucide-react";
import ComingSoon from "@/components/hub/ComingSoon";

export default function AiPage() {
  return (
    <ComingSoon
      title="AI"
      description="Your AI career copilot — resume analysis, job matching, and tailored career insights."
      icon={Sparkles}
      capabilities={[
        "Career Copilot",
        "Resume Analysis",
        "Job Match",
        "Career Insights",
      ]}
    />
  );
}
