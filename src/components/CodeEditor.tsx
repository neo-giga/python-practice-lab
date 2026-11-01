// Thin React wrapper around CodeMirror 6 (the editor itself is not custom).
import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { indentWithTab, indentLess, indentMore } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { editorTheme } from './editorTheme';
import { Icon } from './Icon';

/** Height of a fixed/sticky element if it is currently displayed (0 otherwise). */
function fixedHeight(selector: string): number {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return 0;
  const style = getComputedStyle(el);
  return style.display === 'none' || (style.position !== 'fixed' && style.position !== 'sticky') ? 0 : el.getBoundingClientRect().height;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  /** Ctrl/⌘ + Shift + Enter (coding problems: Submit). */
  onSubmit?: () => void;
  readOnly?: boolean;
  label: string;
  minLines?: number;
  testId?: string;
}

export function CodeEditor({ value, onChange, onRun, onSubmit, readOnly = false, label, minLines = 10, testId }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const ro = useRef(new Compartment());
  const cb = useRef({ onChange, onRun, onSubmit });
  cb.current = { onChange, onRun, onSubmit };

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Shift-Enter',
                run: () => {
                  (cb.current.onSubmit ?? cb.current.onRun)?.();
                  return true;
                },
              },
              {
                key: 'Mod-Enter',
                run: () => {
                  cb.current.onRun?.();
                  return true;
                },
              },
            ]),
          ),
          basicSetup,
          keymap.of([indentWithTab]),
          python(),
          editorTheme,
          EditorView.lineWrapping,
          ro.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorView.theme({ '.cm-content': { minHeight: `${minLines * 1.5}em` } }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) cb.current.onChange(u.state.doc.toString());
          }),
          // Keep the caret clear of the sticky top bar and the bottom dock (Run/Submit + tabs).
          EditorView.scrollMargins.of(() => ({ top: fixedHeight('.topbar') + 8, bottom: fixedHeight('.ws-dock') + 12 })),
        ],
      }),
    });
    view.current = v;
    // A software keyboard shrinks the (visual) viewport: bring the caret back into view.
    const onResize = () => {
      if (!v.hasFocus) return;
      requestAnimationFrame(() => v.dispatch({ effects: EditorView.scrollIntoView(v.state.selection.main.head, { y: 'nearest' }) }));
    };
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      v.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({
      effects: ro.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
    });
  }, [readOnly]);

  const insert = (text: string) => {
    const v = view.current;
    if (!v || readOnly) return;
    v.dispatch(v.state.replaceSelection(text));
    v.focus();
  };
  const run = (cmd: (view: EditorView) => boolean) => {
    const v = view.current;
    if (!v || readOnly) return;
    cmd(v);
    v.focus();
  };

  return (
    <div className="editor" data-testid={testId} data-readonly={readOnly || undefined}>
      <div ref={host} className="editor-host" />
      <div className="keybar" role="toolbar" aria-label="Insert characters">
        <button type="button" onClick={() => run(indentMore)} disabled={readOnly} aria-label="Indent">
          <Icon name="indent" size={16} />
        </button>
        <button type="button" onClick={() => run(indentLess)} disabled={readOnly} aria-label="Dedent">
          <Icon name="dedent" size={16} />
        </button>
        {[':', '(', ')', '[', ']', '{', '}', '"', '_', '='].map((ch) => (
          <button type="button" key={ch} onClick={() => insert(ch)} disabled={readOnly} aria-label={`Insert ${ch}`}>
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
}
