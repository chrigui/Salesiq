/**
 * Deterministic mock analytics for the dashboards. Seeded so charts are stable
 * across renders. A production build swaps these for queries against the
 * per-tenant analytics store.
 */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function sessionTrend(days = 30) {
  const rnd = seeded(7);
  return Array.from({ length: days }, (_, i) => {
    const base = 40 + i * 1.4;
    return {
      day: `D${i + 1}`,
      sessions: Math.round(base + rnd() * 30),
      conversions: Math.round((base + rnd() * 30) * (0.18 + rnd() * 0.12)),
    };
  });
}

// ---- Sales-trend waffle chart (new vs existing users) ----

export type SalesPeriod = "Weekly" | "Monthly" | "Yearly";

export interface SalesColumn {
  newUsers: number;
  existingUsers: number;
}
export interface SalesGroup {
  label: string;
  columns: SalesColumn[];
}
export interface SalesSeries {
  groups: SalesGroup[];
  /** Total revenue headline shown above the chart. */
  total: number;
  /** Max value a single column can reach — sets the y-axis ceiling. */
  ceiling: number;
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** Deterministic new/existing-user series for the dot-matrix chart. */
export function salesSeries(period: SalesPeriod = "Monthly"): SalesSeries {
  const config: Record<SalesPeriod, { labels: string[]; perGroup: number; seed: number }> = {
    Weekly: { labels: ["W1", "W2", "W3", "W4", "W5", "W6"], perGroup: 5, seed: 3 },
    Monthly: { labels: MONTHS, perGroup: 4, seed: 7 },
    Yearly: { labels: ["2020", "2021", "2022", "2023", "2024", "2025"], perGroup: 4, seed: 13 },
  };
  const { labels, perGroup, seed } = config[period];
  const rnd = seeded(seed);
  const groups: SalesGroup[] = labels.map((label) => ({
    label,
    columns: Array.from({ length: perGroup }, () => {
      const existingUsers = Math.round((6 + rnd() * 16) * 1000);
      const newUsers = Math.round((4 + rnd() * 34) * 1000);
      return { newUsers, existingUsers };
    }),
  }));
  return { groups, total: 20320, ceiling: 60000 };
}

export const popularProducts = [
  { name: "Green Hills", selected: 312 },
  { name: "Marina Vista", selected: 268 },
  { name: "Azure Residences", selected: 191 },
  { name: "Olive Grove", selected: 144 },
];

export const funnel = [
  { stage: "Sessions started", value: 1840 },
  { stage: "Questions completed", value: 1327 },
  { stage: "Recommendation viewed", value: 1102 },
  { stage: "Proposal generated", value: 486 },
  { stage: "Deal closed", value: 213 },
];

export const popularQuestions = [
  { q: "Budget", rate: 98 },
  { q: "Bedrooms", rate: 91 },
  { q: "Near schools", rate: 84 },
  { q: "Sea view", rate: 77 },
  { q: "Investment intent", rate: 63 },
];

export const companyKpis = [
  { label: "Sessions this month", value: "1,840", delta: "+12.4%", up: true },
  { label: "Conversion rate", value: "11.6%", delta: "+1.8pt", up: true },
  { label: "Avg. session", value: "8m 42s", delta: "+34s", up: true },
  { label: "Active leads", value: "329", delta: "-3.1%", up: false },
];

// ---- Platform-level (master admin) ----

export function mrrTrend(months = 12) {
  const rnd = seeded(21);
  let mrr = 82000;
  return Array.from({ length: months }, (_, i) => {
    mrr += 6000 + rnd() * 9000;
    return {
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i % 12],
      mrr: Math.round(mrr),
    };
  });
}

export const platformKpis = [
  { label: "MRR", value: "$184.2k", delta: "+9.3%", up: true },
  { label: "ARR", value: "$2.21M", delta: "+41%", up: true },
  { label: "Active tenants", value: "127", delta: "+6", up: true },
  { label: "Net churn", value: "1.4%", delta: "-0.6pt", up: true },
];

export const tenants = [
  { name: "Green Hills Living", vertical: "Real Estate", plan: "Enterprise", seats: 48, sessions: 1840, mrr: 4200, health: "healthy" },
  { name: "Vantage Motors", vertical: "Automotive", plan: "Growth", seats: 22, sessions: 962, mrr: 1800, health: "healthy" },
  { name: "Meridian Aviation", vertical: "Private Jets", plan: "Enterprise", seats: 12, sessions: 214, mrr: 6900, health: "healthy" },
  { name: "Helix Medical", vertical: "Medical Equipment", plan: "Growth", seats: 31, sessions: 733, mrr: 2100, health: "watch" },
  { name: "Coastline Yachts", vertical: "Yachts", plan: "Starter", seats: 6, sessions: 98, mrr: 490, health: "at-risk" },
  { name: "Assured Cover", vertical: "Insurance", plan: "Growth", seats: 40, sessions: 1512, mrr: 2400, health: "healthy" },
];

export const usageByVertical = [
  { name: "Real Estate", value: 38 },
  { name: "Automotive", value: 22 },
  { name: "Insurance", value: 16 },
  { name: "Medical", value: 12 },
  { name: "Aviation", value: 7 },
  { name: "Other", value: 5 },
];
