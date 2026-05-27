// Parse an assistant message for the artifact code block + suggested name.
// Tolerant of partial streams — extractCodeBlock will surface an in-progress
// block (no closing fence yet) so the right pane can update as text streams.

import type { FileKind } from '../repo/types';

export type ExtractedCode = { kind: FileKind; source: string; complete: boolean };

const FENCE_RE = /```(jsx|tsx|js|ts|html?)\s*\n([\s\S]*?)(?:```|$)/gi;

function normalizeKind(tag: string): FileKind {
  const t = tag.toLowerCase();
  if (t === 'html' || t === 'htm') return 'html';
  return 'jsx';
}

export function extractCodeBlock(text: string): ExtractedCode | null {
  let last: { kind: FileKind; source: string; complete: boolean } | null = null;
  FENCE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FENCE_RE.exec(text)) !== null) {
    const tag = m[1] ?? '';
    const body = m[2] ?? '';
    const matched = m[0];
    const complete = matched.endsWith('```');
    last = { kind: normalizeKind(tag), source: body, complete };
  }
  return last;
}

const NAME_RE = /<name>([^<\n]+)<\/name>/i;

export function extractSuggestedName(text: string): string | null {
  const m = NAME_RE.exec(text);
  if (!m) return null;
  return m[1].trim().slice(0, 80) || null;
}

// What the chat column displays — everything outside the last code block and
// the <name> tag.
export function extractProse(text: string): string {
  let out = text.replace(NAME_RE, '');
  out = out.replace(/```(?:jsx|tsx|js|ts|html?)\s*\n[\s\S]*?(?:```|$)/gi, '');
  return out.trim();
}
