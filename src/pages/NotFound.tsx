import { href } from '../lib/router';

export function NotFoundPage({ path }: { path: string }) {
  return (
    <div className="page page-narrow" data-testid="not-found">
      <h1>Page not found</h1>
      <p className="lede">
        Nothing lives at <code>#/{path}</code>. The link may be mistyped or from an older version of the site.
      </p>
      <ul className="link-list">
        <li>
          <a href={href({ page: 'today' })}>Today</a>: your plan and next problem
        </li>
        <li>
          <a href={href({ page: 'problems' })}>Problems</a>: every coding problem
        </li>
        <li>
          <a href={href({ page: 'fluency' })}>Python fluency</a> drills
        </li>
        <li>
          <a href={href({ page: 'learn' })}>Reference</a>: runnable Python recipes
        </li>
      </ul>
    </div>
  );
}
