import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";

const PATHS = ["", "/product", "/how-it-works", "/trust", "/procurement", "/suppliers", "/developers", "/manifesto", "/faq", "/waitlist"];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return PATHS.map((path) => ({
    url: `${origin}${path || "/"}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
