import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { ReconnectingToast } from "@/components/sync/ReconnectingToast";

export const metadata: Metadata = {
  title: "SalesIQ · Decision Intelligence Platform",
  description:
    "An industry-agnostic platform that guides customers through complex purchasing decisions with interactive presentations, AI, and visual storytelling.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SalesIQ",
  },
};

export const viewport = {
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SyncProvider>
            {children}
            <ReconnectingToast />
          </SyncProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
