import type { ContentPost } from "../types";

/** DEMO DATA - sample social posts for the demo month (November 2026). Nothing here has been published. */
export const DEMO_CONTENT_MONTH = { year: 2026, month: 10 } as const; // 0-indexed month => November

export const DEMO_POSTS: ContentPost[] = [
  { id: "post_1", title: "Before & after: café shopfront refresh", body: "From tired to standout. Swipe to see how a new illuminated fascia lifted foot traffic for a local café. #signage #shopfront", platform: "INSTAGRAM", status: "PUBLISHED", scheduledAt: "2026-11-03T09:00", author: "Demo Editor", source: "DEMO" },
  { id: "post_2", title: "Wayfinding that reduces support calls", body: "Clear wayfinding isn't decoration – it's operations. Here's how facility managers cut visitor confusion with a structured sign family.", platform: "LINKEDIN", status: "PUBLISHED", scheduledAt: "2026-11-04T08:30", author: "Demo Manager", source: "DEMO" },
  { id: "post_3", title: "Meet the install team", body: "Our crews handle permits, access equipment and after-hours installs so your business keeps trading.", platform: "FACEBOOK", status: "SCHEDULED", scheduledAt: "2026-11-10T12:00", author: "Demo Editor", source: "DEMO" },
  { id: "post_4", title: "LED vs neon: running costs explained", body: "LED signage uses a fraction of the power of traditional neon. We break down lifespan, maintenance and brightness.", platform: "LINKEDIN", status: "APPROVED", scheduledAt: "2026-11-12T08:30", author: "Demo Editor", source: "DEMO" },
  { id: "post_5", title: "Reel: channel letters in production", body: "Watch acrylic channel letters go from CNC to install in 30 seconds. ✨", platform: "INSTAGRAM", status: "IN_REVIEW", scheduledAt: "2026-11-13T17:00", author: "Demo Editor", source: "DEMO" },
  { id: "post_6", title: "End-of-year install slots", body: "Planning a refit before the new year? Book a site measure now to secure a December install window.", platform: "FACEBOOK", status: "IN_REVIEW", scheduledAt: "2026-11-17T10:00", author: "Demo Manager", source: "DEMO" },
  { id: "post_7", title: "Case study: business park pylon", body: "A multi-tenant pylon sign that keeps every tenant visible from the highway – and is easy to update.", platform: "LINKEDIN", status: "CHANGES_REQUESTED", scheduledAt: "2026-11-19T08:30", author: "Demo Editor", source: "DEMO" },
  { id: "post_8", title: "Signage checklist for new tenancies", body: "Moving into a new site? Our 6-point checklist covers landlord approval, council permits and brand consistency.", platform: "FACEBOOK", status: "DRAFT", scheduledAt: "2026-11-24T11:00", author: "Demo Editor", source: "DEMO" },
  { id: "post_9", title: "Material spotlight: brushed aluminium", body: "Durable, premium and weather-resistant. Where brushed aluminium works best for corporate signage.", platform: "INSTAGRAM", status: "DRAFT", scheduledAt: "2026-11-26T17:00", author: "Demo Editor", source: "DEMO" },
  { id: "post_10", title: "Compliance: accessible signage basics", body: "Tactile and braille signage requirements explained for building owners and facility managers.", platform: "LINKEDIN", status: "DRAFT", scheduledAt: "2026-11-30T08:30", author: "Demo Manager", source: "DEMO" },
];
