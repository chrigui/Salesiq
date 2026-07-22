import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";

export const metadata: Metadata = {
  title: "SalesIQ · Decision Intelligence Platform",
  description:
    "An industry-agnostic platform that guides customers through complex purchasing decisions with interactive presentations, AI, and visual storytelling.",
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
          <SyncProvider>{children}</SyncProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
