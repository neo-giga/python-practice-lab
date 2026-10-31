import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Dark, high-contrast code surface matching the static code blocks.
const theme = EditorView.theme(
  {
    '&': { color: '#e6edf3', backgroundColor: 'var(--code-bg)', fontSize: 'var(--code-size)' },
    '.cm-content': { fontFamily: 'var(--mono)', caretColor: '#7ee2c8', padding: '10px 0' },
    '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: '#6e7c8c', border: 'none' },
    '.cm-activeLine': { backgroundColor: '#ffffff0a' },
    '.cm-activeLineGutter': { backgroundColor: '#ffffff0f', color: '#c9d4df' },
    '&.cm-focused .cm-cursor': { borderLeftColor: '#7ee2c8', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, ::selection, .cm-selectionBackground': { backgroundColor: '#2f5d6b !important' },
    '.cm-matchingBracket': { backgroundColor: '#ffffff1f', outline: '1px solid #7ee2c855' },
    '.cm-tooltip': { backgroundColor: '#18222d', color: '#e6edf3', border: '1px solid #2b3a48' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#2f5d6b' },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: '#ff9fb2' },
  { tag: [t.string, t.special(t.string)], color: '#a5e5a0' },
  { tag: [t.number, t.bool, t.null], color: '#f5c46b' },
  { tag: [t.comment, t.lineComment], color: '#8b9aab', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#8ecbff' },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: '#8ecbff' },
  { tag: [t.className, t.definition(t.className)], color: '#f5c46b' },
  { tag: [t.self], color: '#ff9fb2' },
  { tag: [t.propertyName], color: '#c8d7e6' },
  { tag: [t.operator], color: '#d4dde7' },
]);

export const editorTheme = [theme, syntaxHighlighting(highlight)];
