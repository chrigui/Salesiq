import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteNav } from "@/components/nav/site-nav";
import { SiteFooter } from "@/components/footer/site-footer";
import { organizationJsonLd, softwareApplicationJsonLd } from "@/lib/structured-data";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.salesiq.ai"),
  title: {
    default: "SalesIQ — Enterprise AI Decision Intelligence",
    template: "%s — SalesIQ",
  },
  description:
    "SalesIQ is the Decision Intelligence platform that helps enterprise sales teams sell with the clarity, confidence and evidence of their best rep — every time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fraunces.variable} suppressHydrationWarning>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd()) }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <MotionConfig reducedMotion="user">
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <SiteNav />
            {children}
            <SiteFooter />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
