import { copy } from "@/lib/copy";
import { ogCard, ogContentType, ogSize } from "@/lib/og/card";

export const alt = copy("meta.developers.og_title");
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogCard(copy("meta.developers.og_title"));
}
