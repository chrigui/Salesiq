import { DisplayStage } from "@/components/display/DisplayStage";
import { PairingOverlay } from "@/components/sync/Pairing";

export const metadata = {
  title: "Customer Display · SalesIQ",
};

export default function DisplayPage() {
  return (
    <>
      <DisplayStage />
      <PairingOverlay />
    </>
  );
}
