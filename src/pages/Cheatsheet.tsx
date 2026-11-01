// "Coding interview cheatsheet": every skill, ordered by frequency tier, searchable and printable.
import { useEffect, useRef, useState } from 'react';
import { STRAND_LABEL, TIER_LABEL, skills, strandOf } from '../content/skills';
import { Icon } from '../components/Icon';
import { orderSkills, orderTemplates } from '../lib/skill-plan';
import { href, navigate, type Route } from '../lib/router';
import { CheatCard } from './SkillPages';

const syntaxSkills = orderSkills(skills.filter((s) => strandOf(s) === 'syntax'));
const templateSkills = orderTemplates(skills.filter((s) => strandOf(s) === 'algorithm'));
const essentialSkills = skills.filter((s) => strandOf(s) === 'essentials'); // curated order, not measured
const ordered = [...syntaxSkills, ...templateSkills, ...essentialSkills];
const haystack = (s: (typeof skills)[number]) => [s.title, s.summary, s.cheat?.syntax, s.cheat?.useCase, s.cheat?.trap, s.id].join('\n').toLowerCase();

export function CheatsheetPage({ route }: { route: Extract<Route, { page: 'cheatsheet' }> }) {
  const [q, setQ] = useState(route.q ?? '');
  const latest = useRef(route);
  latest.current = route;
  useEffect(() => setQ(route.q ?? ''), [route.q]);
  useEffect(() => {
    if ((route.q ?? '') === q) return;
    const from = location.hash;
    const t = setTimeout(() => {
      if (location.hash === from) navigate({ page: 'cheatsheet', q: q || undefined }, true);
    }, 250);
    return () => clearTimeout(t);
  }, [q, route.q]);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = ordered.filter((s) => words.every((w) => haystack(s).includes(w)));
  return (
    <div className="page cheatsheet" data-testid="cheatsheet">
      <header className="page-head">
        <div>
          <h1>Coding interview cheatsheet</h1>
          <p className="lede">
            Every Python skill a LeetCode solution needs, most used first; the percentage is the share of solutions that use it.
            {templateSkills.length > 0 && ' Then the algorithm templates to write from memory, by how often interview problems need them.'}
            {essentialSkills.length > 0 && ' Last, the interview essentials: classes for design questions, code style, the math module and input shapes, which are not frequency-measured.'}
          </p>
        </div>
        <div className="head-actions no-print">
          <button type="button" className="btn btn-quiet" onClick={() => window.print()} data-testid="print">
            <Icon name="print" />
            Print
          </button>
        </div>
      </header>
      <div className="filters no-print" role="search">
        <label className="search">
          <Icon name="search" />
          <span className="visually-hidden">Search the cheatsheet</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: heap, slice, Counter…" autoComplete="off" spellCheck={false} name="q" data-testid="cheat-search" />
        </label>
        <span className="muted small" role="status" data-testid="cheat-count">
          {visible.length === ordered.length ? `${ordered.length} skills` : `${visible.length} of ${ordered.length} skills`}
        </span>
      </div>
      {visible.length === 0 && (
        <p className="empty-state" data-testid="cheat-empty">
          Nothing matches “{q}”. Try a shorter word, such as “dict” or “sort”.
        </p>
      )}
      {([1, 2, 3] as const).map((tier) => {
        const items = visible.filter((s) => strandOf(s) === 'syntax' && s.tier === tier);
        if (!items.length) return null;
        return (
          <section key={tier} className="cheat-tier" aria-labelledby={`tier-h-${tier}`}>
            <h2 id={`tier-h-${tier}`}>
              Tier {tier} · {TIER_LABEL[tier]}
            </h2>
            <div className="cheat-grid">
              {items.map((s) => (
                <CheatCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        );
      })}
      {visible.some((s) => strandOf(s) === 'algorithm') && (
        <section className="cheat-tier" aria-labelledby="tier-h-algo" data-testid="cheat-templates">
          <h2 id="tier-h-algo">{STRAND_LABEL.algorithm}</h2>
          <div className="cheat-grid">
            {visible
              .filter((s) => strandOf(s) === 'algorithm')
              .map((s) => (
                <CheatCard key={s.id} s={s} />
              ))}
          </div>
        </section>
      )}
      {visible.some((s) => strandOf(s) === 'essentials') && (
        <section className="cheat-tier" aria-labelledby="tier-h-essentials" data-testid="cheat-essentials">
          <h2 id="tier-h-essentials">{STRAND_LABEL.essentials}</h2>
          <p className="muted small cheat-tier-note">Not frequency-measured: what interviewers expect beyond LeetCode syntax, in reading order.</p>
          <div className="cheat-grid">
            {visible
              .filter((s) => strandOf(s) === 'essentials')
              .map((s) => (
                <CheatCard key={s.id} s={s} />
              ))}
          </div>
        </section>
      )}
      <p className="muted small cheat-sources" data-testid="cheat-sources">
        Frequencies measured by counting Python constructs (no text copied) in open-licensed LeetCode solution repositories, weighted toward the Grind 75
        interview list. <a href={href({ page: 'about' })}>Sources and licences</a>.
      </p>
      <p className="muted small no-print">
        Want the long form? The <a href={href({ page: 'learn' })}>full reference</a> has 74 runnable recipes with their exact output.
      </p>
    </div>
  );
}
