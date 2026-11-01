import { useRef, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { href } from '../lib/router';

/** The displayed string is the single source for both clipboard and Playground. */
export function SnippetBlock({ code, snippet }: { code: string; snippet: string }) {
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState(false);
  const fallback = useRef<HTMLTextAreaElement>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setManual(false);
      setStatus('Copied.');
    } catch {
      setManual(true);
      setStatus('Clipboard unavailable. Select and copy the source below manually.');
    }
  };
  return (
    <div className="snippet-block">
      <CodeBlock code={code} />
      <div className="snippet-actions no-print">
        <button className="btn btn-quiet" type="button" onClick={copy}>Copy</button>
        <a className="btn btn-quiet" href={href({ page: 'playground', snippet })}>Try in Playground</a>
      </div>
      <p className="small no-print" role="status">{status}</p>
      {manual && (
        <label className="manual-copy no-print">
          Source for manual copy
          <textarea ref={fallback} readOnly value={code} onFocus={() => fallback.current?.select()} rows={5} />
        </label>
      )}
    </div>
  );
}
