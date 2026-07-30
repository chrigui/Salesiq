import { z } from "zod";

// The 4 industry packs that actually ship today, plus "other" for every
// other vertical the brief lists as a future page — matching what the
// product itself supports, not the full aspirational sitemap.
export const INDUSTRY_OPTIONS = [
  { value: "real-estate", label: "Real estate" },
  { value: "automotive", label: "Automotive" },
  { value: "aviation", label: "Private aviation" },
  { value: "yacht-charter", label: "Yacht charter" },
  { value: "other", label: "Other" },
] as const;

export const COMPANY_SIZE_OPTIONS = [
  { value: "1-50", label: "1–50 employees" },
  { value: "51-250", label: "51–250 employees" },
  { value: "251-1000", label: "251–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
] as const;

export const demoRequestSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid work email.").max(200),
  company: z.string().trim().min(2, "Enter your company name.").max(160),
  companySize: z.enum(COMPANY_SIZE_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  industry: z.enum(INDUSTRY_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
