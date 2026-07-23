import { DisplayStage } from "@/components/display/DisplayStage";
import { PairingOverlay } from "@/components/sync/Pairing";
import { DisplayKiosk } from "@/components/display/DisplayKiosk";

export const metadata = {
  title: "Customer Display · SalesIQ",
};

export default function DisplayPage() {
  return (
    <>
      <DisplayStage />
      <PairingOverlay />
      <DisplayKiosk />
    </>
  );
}
