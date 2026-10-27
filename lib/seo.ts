import type { Metadata } from "next";
import { copy, type CopyKey } from "@/lib/copy";

export const PAGE_IDS = [
  "home",
  "product",
  "how",
  "trust",
  "suppliers",
  "procurement",
  "developers",
  "manifesto",
  "faq",
  "waitlist",
  "privacy",
  "terms",
  "notfound",
] as const;

export type PageId = (typeof PAGE_IDS)[number];

const NOINDEX = new Set<PageId>(["privacy", "terms", "notfound"]);

export function siteOrigin(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function pageMetadata(page: PageId): Metadata {
  const title = copy(`meta.${page}.title` as CopyKey);
  const description = copy(`meta.${page}.description` as CopyKey);
  return {
    title,
    description,
    openGraph: {
      title: copy(`meta.${page}.og_title` as CopyKey),
      description: copy(`meta.${page}.og_description` as CopyKey),
      type: "website",
    },
    robots: NOINDEX.has(page) ? { index: false, follow: true } : { index: true, follow: true },
  };
}
