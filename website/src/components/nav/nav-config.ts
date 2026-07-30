export type NavStatus = "live" | "planned";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  status: NavStatus;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The full eventual sitemap (all 30 pages from the site brief), grouped and
 * tagged live/planned. <SiteNav> renders only `status: "live"` entries —
 * `planned` ones are simply absent from the menu, not shown as disabled or
 * "coming soon," so there are never dead links. Flipping a page live in a
 * later phase is a one-line change here plus a new route folder, not a nav
 * rearchitecture. This file is also the single source of truth the ⌘K
 * command palette searches.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Platform overview", href: "/platform", description: "The five surfaces, one Decision Engine.", status: "live" },
      { label: "How SalesIQ works", href: "/how-it-works", description: "From first question to signed deal.", status: "planned" },
      { label: "AI Sales Twin", href: "/platform/ai-sales-twin", description: "Every rep's best day, on repeat.", status: "planned" },
      { label: "Guided Selling", href: "/platform/guided-selling", description: "The right question, every time.", status: "planned" },
      { label: "Explainable AI", href: "/platform/explainable-ai", description: "Every recommendation shows its work.", status: "planned" },
      { label: "Decision Engine", href: "/platform/decision-engine", description: "The reasoning layer under every match.", status: "planned" },
      { label: "Business Impact Dashboard", href: "/platform/business-impact-dashboard", description: "Pipeline, explained in plain numbers.", status: "planned" },
      { label: "Enterprise Architecture", href: "/architecture", description: "How SalesIQ is built to run at scale.", status: "planned" },
      { label: "Integrations", href: "/integrations", description: "Where SalesIQ fits in your stack.", status: "planned" },
      { label: "Security", href: "/security", description: "Encryption, RBAC, audit, compliance.", status: "planned" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "Industry solutions", href: "/solutions", description: "Configured, not customized.", status: "planned" },
      { label: "Real estate", href: "/solutions/real-estate", description: "", status: "planned" },
      { label: "Automotive", href: "/solutions/automotive", description: "", status: "planned" },
      { label: "Healthcare", href: "/solutions/healthcare", description: "", status: "planned" },
      { label: "Financial services", href: "/solutions/financial-services", description: "", status: "planned" },
      { label: "Luxury retail", href: "/solutions/luxury-retail", description: "", status: "planned" },
      { label: "Industrial equipment", href: "/solutions/industrial-equipment", description: "", status: "planned" },
      { label: "Aviation", href: "/solutions/aviation", description: "", status: "planned" },
    ],
  },
  {
    label: "What's next",
    items: [
      { label: "Decision Intelligence Graph", href: "/vision/decision-intelligence-graph", description: "The connective layer across every deal.", status: "planned" },
      { label: "Executive War Room", href: "/vision/executive-war-room", description: "Real-time command view for leadership.", status: "planned" },
      { label: "Digital Deal Room", href: "/vision/digital-deal-room", description: "Every stakeholder, one shared room.", status: "planned" },
      { label: "Interactive Decision Book", href: "/vision/interactive-decision-book", description: "The proposal that explains itself.", status: "planned" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "Why SalesIQ", href: "/why-salesiq", description: "The outcomes, plainly stated.", status: "planned" },
      { label: "Decision Intelligence", href: "/decision-intelligence", description: "The category, defined.", status: "live" },
      { label: "Pilot program", href: "/pilot-program", description: "Scope, timeline, ROI.", status: "planned" },
      { label: "About SalesIQ", href: "/about", description: "Our vision and mission.", status: "planned" },
      { label: "Resources", href: "/resources", description: "Guides, research, product notes.", status: "planned" },
    ],
  },
];

export const pricingItem: NavItem = {
  label: "Pricing",
  href: "/pricing",
  description: "Enterprise pricing, plainly scoped.",
  status: "live",
};

export const demoItem: NavItem = {
  label: "Book a demo",
  href: "/demo",
  description: "Talk to our team.",
  status: "live",
};

export function liveNavGroups(): NavGroup[] {
  return navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.status === "live") }))
    .filter((group) => group.items.length > 0);
}

export function allSearchableItems(): NavItem[] {
  return [pricingItem, ...navGroups.flatMap((g) => g.items)].filter((item) => item.status === "live");
}
