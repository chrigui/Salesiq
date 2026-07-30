const SITE_URL = "https://www.salesiq.ai";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SalesIQ",
    url: SITE_URL,
    description:
      "SalesIQ is the Decision Intelligence platform for enterprise sales teams: guided selling, explainable AI, and a decision engine that shows its work on every recommendation.",
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SalesIQ",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "A Decision Intelligence platform for enterprise sales teams selling complex, high-consideration purchases.",
  };
}
