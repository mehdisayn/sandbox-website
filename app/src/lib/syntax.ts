// Minimal regex tokenizer for JSX/JS and HTML. Returns a flat token stream
// so the CodeEditor can render colored spans behind its textarea. Imperfect
// (it doesn't try to be a real parser), but enough for at-a-glance reading.

export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'tag' | 'plain';
export type Token = { type: TokenType; value: string };

const KEYWORDS = new Set([
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'import', 'export', 'from', 'default',
  'as', 'new', 'delete', 'in', 'of', 'typeof', 'instanceof', 'true', 'false',
  'null', 'undefined', 'await', 'async', 'class', 'extends', 'super', 'this',
  'try', 'catch', 'finally', 'throw', 'void', 'yield',
]);

// JS/JSX: comment | quoted-string | template-string | jsx-tag-open | number | identifier
const RE_JS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.-]*)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)/g;

// HTML: comment | string | doctype | tag-open
const RE_HTML = /(<!--[\s\S]*?-->)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<!DOCTYPE[^>]*>|<\/?[A-Za-z][\w.-]*)/gi;

export function tokenize(src: string, lang: 'jsx' | 'html'): Token[] {
  const out: Token[] = [];
  const re = lang === 'html' ? RE_HTML : RE_JS;
  let last = 0;
  for (const m of src.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ type: 'plain', value: src.slice(last, i) });

    if (lang === 'html') {
      if (m[1]) out.push({ type: 'comment', value: m[1] });
      else if (m[2]) out.push({ type: 'string',  value: m[2] });
      else if (m[3]) out.push({ type: 'tag',     value: m[3] });
    } else {
      if      (m[1]) out.push({ type: 'comment', value: m[1] });
      else if (m[2]) out.push({ type: 'string',  value: m[2] });
      else if (m[3]) out.push({ type: 'string',  value: m[3] });
      else if (m[4]) out.push({ type: 'tag',     value: m[4] });
      else if (m[5]) out.push({ type: 'number',  value: m[5] });
      else if (m[6]) out.push({ type: KEYWORDS.has(m[6]) ? 'keyword' : 'plain', value: m[6] });
    }
    last = i + m[0].length;
  }
  if (last < src.length) out.push({ type: 'plain', value: src.slice(last) });
  return out;
}
