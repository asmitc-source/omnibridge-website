import { copy, type CopyKey } from "@/lib/copy";

const PLACEHOLDER = /(\[[A-Za-z ]+\])/g;

export function RichText({ text, linkPhrases = false }: { text: string; linkPhrases?: boolean }) {
  const terms = copy("footer.legal.terms");
  const privacy = copy("footer.legal.privacy");
  const chunks = text.split(PLACEHOLDER);
  return (
    <>
      {chunks.map((chunk, index) => {
        if (/^\[[A-Za-z ]+\]$/.test(chunk)) {
          return (
            <span key={index} className="placeholder-chip">
              {chunk}
            </span>
          );
        }
        if (!linkPhrases) return <span key={index}>{chunk}</span>;
        return <LinkedChunk key={index} text={chunk} terms={terms} privacy={privacy} />;
      })}
    </>
  );
}

function LinkedChunk({ text, terms, privacy }: { text: string; terms: string; privacy: string }) {
  const pattern = new RegExp(`(${escapeRegExp(terms)}|${escapeRegExp(privacy)})`, "g");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) => {
        if (part === terms) {
          return (
            <a key={index} href="/terms">
              {part}
            </a>
          );
        }
        if (part === privacy) {
          return (
            <a key={index} href="/privacy">
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function T({
  k,
  vars,
  linkPhrases = false,
}: {
  k: CopyKey;
  vars?: Record<string, string | number>;
  linkPhrases?: boolean;
}) {
  return <RichText text={copy(k, vars)} linkPhrases={linkPhrases} />;
}
