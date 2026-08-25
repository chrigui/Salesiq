/**
 * Native share (falling back to clipboard copy) for a real, already-minted
 * URL — shared by DisplaySaveShare (the kiosk's own share button) and the
 * Companion's "Send link" control so there's exactly one share/copy
 * implementation, not two slightly different ones.
 */
export async function shareOrCopyLink(url: string, title: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
