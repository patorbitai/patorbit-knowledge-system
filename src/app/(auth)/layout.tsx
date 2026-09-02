import { MarketingThemeScope } from "@/components/marketing/MarketingThemeScope";
import "@/app/(marketing)/marketing-theme.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeScope>
      {children}
    </MarketingThemeScope>
  );
}
