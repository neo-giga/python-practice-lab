// Static syntax highlighting for read-only code blocks, using the same Lezer
// Python grammar CodeMirror uses in the editor (no separate highlighter).
import { highlightCode, classHighlighter } from '@lezer/highlight';
import { parser } from '@lezer/python';
import type { ReactNode } from 'react';

/**
 * Highlighted tokens, one `<span class="code-line">` per source line (its newline included, except
 * the last). The spans are inline by default, so the block renders as plain highlighted text; a
 * stylesheet can make them blocks to give wrapped lines a hanging indent (the cheatsheet cards do).
 */
export function highlightPython(code: string): ReactNode[] {
  const lines: ReactNode[] = [];
  let line: ReactNode[] = [];
  let key = 0;
  const endLine = (last: boolean) => {
    lines.push(
      <span key={key++} className="code-line">
        {line}
        {last ? null : '\n'}
      </span>,
    );
    line = [];
  };
  highlightCode(
    code,
    parser.parse(code),
    classHighlighter,
    (text, classes) => line.push(classes ? <span key={key++} className={classes}>{text}</span> : text),
    () => endLine(false),
  );
  endLine(true);
  return lines;
}
