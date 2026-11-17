import type { ReactNode } from "react";

/**
 * Renders the small markdown subset MangaDex descriptions use (paragraphs,
 * line breaks, **bold**, *italic*, [links](https://…)) as React elements.
 * No HTML is ever injected, and only http(s) links are kept.
 */
const INLINE_RE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(INLINE_RE)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**") || token.startsWith("__")) {
      out.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const [, label, url] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/) ?? [];
      if (url && /^https?:\/\//i.test(url)) {
        out.push(
          <a key={key} href={url} target="_blank" rel="noopener noreferrer nofollow">
            {label}
          </a>,
        );
      } else {
        out.push(label ?? token);
      }
    } else {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Description({ markdown }: { markdown: string }) {
  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return <p className="italic text-subtle">No description available.</p>;

  return (
    <div className="prose-desc">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        return (
          <p key={pi}>
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {renderInline(line.replace(/^\s*[-*]\s+/, "• "), `${pi}-${li}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
