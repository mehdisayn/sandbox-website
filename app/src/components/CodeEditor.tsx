// Lightweight IDE-like textarea: 2-space indent, Tab / Shift-Tab block
// indent, Enter auto-indent + smart-split on matching pairs, auto-pair
// brackets/quotes, smart Backspace on empty pairs — and syntax coloring
// via a tokenized <pre> rendered behind a transparent <textarea>.

import { useCallback, useMemo, useRef, type ChangeEvent, type KeyboardEvent, type UIEvent } from 'react';
import { tokenize, type Token } from '../lib/syntax';

const INDENT = '  ';
const PAIRS: Record<string, string> = {
  '{': '}', '(': ')', '[': ']',
  '"': '"', "'": "'", '`': '`',
};
const CLOSERS = new Set(Object.values(PAIRS));

type Props = {
  value: string;
  onChange: (next: string) => void;
  language?: 'jsx' | 'html';
  placeholder?: string;
  className?: string;
};

export function CodeEditor({ value, onChange, language = 'jsx', placeholder, className = '' }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const tokens = useMemo<Token[]>(() => tokenize(value, language), [value, language]);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleScroll = useCallback((e: UIEvent<HTMLTextAreaElement>) => {
    const pre = preRef.current;
    if (!pre) return;
    pre.scrollTop = e.currentTarget.scrollTop;
    pre.scrollLeft = e.currentTarget.scrollLeft;
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const { selectionStart: start, selectionEnd: end, value: v } = ta;
    const hasSelection = start !== end;

    // ----- Tab / Shift-Tab: indent or outdent ---------------------------
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = v.lastIndexOf('\n', start - 1) + 1;
      const multi = hasSelection && v.slice(start, end).includes('\n');

      if (multi || e.shiftKey) {
        const blockStart = lineStart;
        const blockEnd = end;
        const block = v.slice(blockStart, blockEnd);
        const lines = block.split('\n');
        let removedFirst = 0;
        const next = lines.map((line, i) => {
          if (e.shiftKey) {
            const m = line.match(/^( {1,2}|\t)/);
            if (!m) return line;
            if (i === 0) removedFirst = m[0].length;
            return line.slice(m[0].length);
          }
          return INDENT + line;
        }).join('\n');

        const delta = e.shiftKey ? -(block.length - next.length) : INDENT.length * lines.length;
        const newValue = v.slice(0, blockStart) + next + v.slice(blockEnd);
        onChange(newValue);
        requestAnimationFrame(() => {
          ta.selectionStart = Math.max(blockStart, start - (e.shiftKey ? removedFirst : -INDENT.length));
          ta.selectionEnd = blockEnd + delta;
        });
        return;
      }

      const newValue = v.slice(0, start) + INDENT + v.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + INDENT.length; });
      return;
    }

    // ----- Enter: auto-indent (+ smart split between matching pair) -----
    if (e.key === 'Enter' && !e.shiftKey) {
      const lineStart = v.lastIndexOf('\n', start - 1) + 1;
      const lineSoFar = v.slice(lineStart, start);
      const leading = lineSoFar.match(/^[ \t]*/)?.[0] ?? '';
      const prev = v[start - 1];
      const next = v[end];
      const opensBlock = prev === '{' || prev === '(' || prev === '[' || prev === '>';
      const closesBlock = next === '}' || next === ')' || next === ']' || next === '<';

      if (opensBlock && closesBlock) {
        e.preventDefault();
        const inner = '\n' + leading + INDENT;
        const outer = '\n' + leading;
        const insertion = inner + outer;
        const newValue = v.slice(0, start) + insertion + v.slice(end);
        onChange(newValue);
        const caret = start + inner.length;
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = caret; });
        return;
      }

      if (opensBlock || leading.length > 0) {
        e.preventDefault();
        const extra = opensBlock ? INDENT : '';
        const insertion = '\n' + leading + extra;
        const newValue = v.slice(0, start) + insertion + v.slice(end);
        onChange(newValue);
        const caret = start + insertion.length;
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = caret; });
        return;
      }
      return;
    }

    // ----- Auto-close / skip-over for brackets and quotes ---------------
    if (PAIRS[e.key]) {
      const open = e.key;
      const close = PAIRS[open];

      if (open === close && v[start] === open && !hasSelection) {
        e.preventDefault();
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
        return;
      }

      e.preventDefault();
      if (hasSelection) {
        const inner = v.slice(start, end);
        const newValue = v.slice(0, start) + open + inner + close + v.slice(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          ta.selectionStart = start + 1;
          ta.selectionEnd = end + 1;
        });
        return;
      }
      const newValue = v.slice(0, start) + open + close + v.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
      return;
    }

    if (CLOSERS.has(e.key) && !hasSelection && v[start] === e.key) {
      e.preventDefault();
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 1; });
      return;
    }

    // ----- Backspace: delete both halves of an empty matched pair -------
    if (e.key === 'Backspace' && !hasSelection && start > 0) {
      const before = v[start - 1];
      const after = v[start];
      if (PAIRS[before] && PAIRS[before] === after) {
        e.preventDefault();
        const newValue = v.slice(0, start - 1) + v.slice(start + 1);
        onChange(newValue);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start - 1; });
        return;
      }
    }
  }, [onChange]);

  return (
    <div className={['relative overflow-hidden bg-paper', className].join(' ')}>
      <pre
        ref={preRef}
        aria-hidden="true"
        className="absolute inset-0 m-0 overflow-hidden whitespace-pre p-4 md:p-6 font-mono text-[13px] leading-[1.5] text-ink pointer-events-none"
        style={{ tabSize: 2 }}
      >
        {tokens.map((t, i) =>
          t.type === 'plain'
            ? <span key={i}>{t.value}</span>
            : <span key={i} className={`syn-${t.type}`}>{t.value}</span>
        )}
        {'\n'}
      </pre>
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        wrap="off"
        className="code-editor-textarea absolute inset-0 m-0 resize-none whitespace-pre p-4 md:p-6 font-mono text-[13px] leading-[1.5] text-transparent placeholder:text-ink-faint outline-none"
        style={{ tabSize: 2, caretColor: 'rgb(var(--ink))', background: 'transparent' }}
      />
    </div>
  );
}
