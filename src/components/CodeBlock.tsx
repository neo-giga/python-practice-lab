import { highlightPython } from '../lib/highlight';

export function CodeBlock({ code, label, lang = 'python' }: { code: string; label?: string; lang?: 'python' | 'text' }) {
  return (
    <figure className={`codeblock codeblock-${lang}`}>
      {label && <figcaption>{label}</figcaption>}
      <pre tabIndex={0} aria-label={label ?? (lang === 'python' ? 'Python code' : 'Output')}>
        <code>{lang === 'python' ? highlightPython(code) : code}</code>
      </pre>
    </figure>
  );
}
