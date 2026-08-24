"use client";

import { Loader2 } from "lucide-react";
import { LoginScreen } from "@/components/console/LoginScreen";
import { useOrganization } from "@/core/data/organization";
import { useSessionStatus } from "@/core/data/auth";
import { CompanionApp } from "./CompanionApp";
import { StartMeetingScreen } from "./StartMeetingScreen";
import { MeetCustomerScreen } from "./MeetCustomerScreen";
import { DiscoveryWizard } from "./DiscoveryWizard";
import { useMeetingFlow } from "./meetingFlow";

/**
 * The Companion's real front door. `/companion` used to be reachable with no
 * login at all; per the new "director" model it now requires a real,
 * dashboard-provisioned account — same self-gating pattern
 * `/dashboard/page.tsx` already uses (useSessionStatus() + LoginScreen), no
 * new auth system, no self-signup. Once signed in, the guided
 * Start -> Meet -> Discover journey runs in front of the existing,
 * untouched Companion app.
 */
export function CompanionRoot() {
  const org = useOrganization();
  const { session, status } = useSessionStatus();
  const flow = useMeetingFlow();

  if (status === "loading") {
    return (
      <div className="bg-aurora flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!session) {
    return (
      <LoginScreen
        workspaceName={org.name}
        glyph={org.logoGlyph}
        onSuccess={() => {
          /* useSessionStatus() shares SWR's cache — already refreshed. */
        }}
      />
    );
  }

  switch (flow.stage) {
    case "start":
      return <StartMeetingScreen salespersonName={session.name} />;
    case "meet":
      return <MeetCustomerScreen />;
    case "discover":
      return <DiscoveryWizard />;
    case "workspace":
    default:
      return <CompanionApp />;
  }
}
