import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// One editor theme for light and dark: every colour is a CSS custom property
// from app.css, so the editor follows the app theme (and the OS) live.
const theme = EditorView.theme({
  '&': { color: 'var(--code-fg)', backgroundColor: 'var(--code-bg)', fontSize: 'var(--code-size)' },
  '.cm-content': { fontFamily: 'var(--mono)', caretColor: 'var(--accent)', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--gray-800)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--editor-active)', color: 'var(--gray-1000)' },
  '&.cm-focused': { outline: 'none' },
  '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, ::selection, .cm-selectionBackground': { backgroundColor: 'var(--editor-selection) !important' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent-subtle)', outline: '1px solid var(--accent-line)' },
  '.cm-tooltip': { backgroundColor: 'var(--surface)', color: 'var(--gray-1000)', border: '1px solid var(--gray-400)', borderRadius: '6px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--accent-subtle)', color: 'var(--gray-1000)' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--gray-200)', border: 'none', color: 'var(--gray-900)' },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: 'var(--tok-keyword)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--tok-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--tok-number)' },
  { tag: [t.comment, t.lineComment], color: 'var(--tok-comment)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--tok-function)' },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: 'var(--tok-function)' },
  { tag: [t.className, t.definition(t.className)], color: 'var(--tok-class)' },
  { tag: [t.self], color: 'var(--tok-keyword)' },
  { tag: [t.propertyName], color: 'var(--tok-property)' },
]);

export const editorTheme = [theme, syntaxHighlighting(highlight)];
