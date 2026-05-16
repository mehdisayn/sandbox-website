const BUILTIN = new Set<string>(['react', 'react-dom', 'react-dom/client']);

const IMPORT_RE = /(?:import\s+(?:[\w*${},\s]+\s+from\s+)?|require\s*\(\s*)['"]([^'"]+)['"]/g;

export function detectImports(source: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = IMPORT_RE.exec(source)) !== null) {
    const spec = m[1].trim();
    if (!spec) continue;
    if (spec.startsWith('.') || spec.startsWith('/')) continue;
    if (/^https?:\/\//i.test(spec)) continue;
    if (BUILTIN.has(spec.toLowerCase())) continue;
    found.add(spec);
  }
  return [...found];
}
