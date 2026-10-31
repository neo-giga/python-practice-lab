// Static syntax highlighting for read-only code blocks, using the same Lezer
// Python grammar CodeMirror uses in the editor (no separate highlighter).
import { highlightCode, classHighlighter } from '@lezer/highlight';
import { parser } from '@lezer/python';
import type { ReactNode } from 'react';

export function highlightPython(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  highlightCode(
    code,
    parser.parse(code),
    classHighlighter,
    (text, classes) => out.push(classes ? <span key={key++} className={classes}>{text}</span> : text),
    () => out.push('\n'),
  );
  return out;
}
