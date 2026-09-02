import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/Footer";
import { MarketingThemeScope } from "@/components/marketing/MarketingThemeScope";
import "./marketing-theme.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeScope>
      <SiteHeader />
      {children}
      <SiteFooter />
    </MarketingThemeScope>
  );
}
