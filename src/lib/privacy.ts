/**
 * Contact-info masking for the Sales Companion's "Meet the customer" screen.
 * A salesperson may be standing in a public showroom, exhibition, or trade
 * show — a bystander glancing at the phone shouldn't see a stranger's full
 * phone number or email. These are display-only masks (never mutate stored
 * data); the caller decides when to reveal the real value.
 */

/** "Ahmed Al Rashid" -> "Ahmed Al XXXXX" — keeps every name part but the last. */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  const last = parts[parts.length - 1];
  return [...parts.slice(0, -1), "X".repeat(Math.max(3, last.length))].join(" ");
}

/** "+973 3900 1122" -> "+973 •••• 1122" — keeps a leading country code and the last 4 digits. */
export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return trimmed;
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length <= 4) return "•".repeat(digitsOnly.length);

  const countryMatch = trimmed.match(/^\+\d{1,3}/);
  const prefix = countryMatch ? countryMatch[0] : "";
  const lastFour = digitsOnly.slice(-4);
  return `${prefix} •••• ${lastFour}`.trim();
}

/** "fahad@example.com" -> "fah•••@••••.com" — keeps the first few local-part chars and the TLD. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visibleLocal = local.slice(0, Math.min(3, local.length));
  const lastDot = domain.lastIndexOf(".");
  const tld = lastDot === -1 ? "" : domain.slice(lastDot);

  return `${visibleLocal}•••@••••${tld}`;
}
