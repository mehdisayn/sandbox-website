// Ingestion entry point. All four paths (file picker, drag-drop, paste, URL
// import) produce the same shape so the Add modal handles only one input.
// Per PRD.md §4.

import { inferKind, inferName } from './artifacts';
import type { FileKind } from './repo/types';

export type Ingested = {
  content: string;
  filename: string;        // best-effort filename ('' if pasted with no name)
  kind: FileKind;          // inferred from filename or sniffed from content
  source: 'file' | 'drop' | 'paste' | 'url';
};

const ACCEPT_EXT = /\.(jsx|tsx|js|ts|html?|txt)$/i;

function sniffKind(filename: string, content: string): FileKind {
  if (ACCEPT_EXT.test(filename)) return inferKind(filename);
  // No extension hint — sniff. Look for an html doctype or <html/<body in
  // the first 1KB; otherwise treat as JSX (the v1 default).
  const head = content.slice(0, 1024).toLowerCase();
  if (/<!doctype html|<html[\s>]|<body[\s>]/.test(head)) return 'html';
  return 'jsx';
}

export async function fromFile(file: File, source: Ingested['source'] = 'file'): Promise<Ingested> {
  const content = await file.text();
  const filename = file.name;
  return { content, filename, kind: sniffKind(filename, content), source };
}

export function fromText(content: string): Ingested {
  return { content, filename: '', kind: sniffKind('', content), source: 'paste' };
}

const CORS_BLOCK_HINT =
  'The host may not allow cross-origin requests. Try downloading the file and using the file picker instead.';

export async function fromUrl(rawUrl: string): Promise<Ingested> {
  const url = rawUrl.trim();
  if (!url) throw new Error('URL is empty');
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Not a valid URL');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http(s) URLs are supported');
  }
  let res: Response;
  try {
    res = await fetch(parsed.toString(), { mode: 'cors' });
  } catch (err) {
    throw new Error(`Fetch failed. ${CORS_BLOCK_HINT}\n${(err as Error).message}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const content = await res.text();
  const filename = parsed.pathname.split('/').pop() || parsed.hostname;
  return { content, filename, kind: sniffKind(filename, content), source: 'url' };
}

export function suggestedName(i: Ingested): string {
  return i.filename ? inferName(i.filename) : 'Untitled artifact';
}

export const FILE_ACCEPT = '.jsx,.tsx,.js,.ts,.html,.htm,.txt';
