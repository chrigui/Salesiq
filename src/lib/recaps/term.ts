/**
 * Single seam for the customer-facing name of this feature. Every new Recap
 * surface reads copy from here rather than hardcoding the string, so a
 * future per-tenant override (a real config system, not built yet) has
 * exactly one place to plug into. Never "Proposal"/"Offer"/"Contract".
 */
export const RECAP_TERM = "LUMMA Recap";
