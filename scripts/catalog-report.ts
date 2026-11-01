// Catalog counts per pattern and difficulty against the M1 floors.
//   npm run catalog            # table + floor check (exit 0 always; prints SHORT lines)
//   npm run catalog -- --strict  # exit 1 if any floor is missed
import { codingProblems } from '../src/content/index';
import { CORE_MIN, SECONDARY_MIN_TOTAL, patterns } from '../src/content/patterns';

const strict = process.argv.includes('--strict');
const rows = patterns.map((p) => {
  const mine = codingProblems.filter((x) => x.pattern === p.id);
  const n = (d: string) => mine.filter((x) => x.difficulty === d).length;
  const e = n('easy'), m = n('medium'), h = n('hard');
  const ok = p.tier === 'core' ? e >= CORE_MIN.easy && m >= CORE_MIN.medium : mine.length >= SECONDARY_MIN_TOTAL;
  return { id: p.id, tier: p.tier, e, m, h, total: mine.length, ok };
});
const upgraded = codingProblems.filter((p) => p.legacy).length;
console.log(`coding problems: ${codingProblems.length} (${upgraded} upgraded drills + ${codingProblems.length - upgraded} new)`);
console.log('pattern'.padEnd(18), 'tier'.padEnd(10), 'E', 'M', 'H', 'total', 'floor');
for (const r of rows) console.log(r.id.padEnd(18), r.tier.padEnd(10), r.e, r.m, r.h, String(r.total).padEnd(5), r.ok ? 'ok' : 'SHORT');
const short = rows.filter((r) => !r.ok);
console.log(`\nfloors (core E${CORE_MIN.easy}/M${CORE_MIN.medium}, secondary >= ${SECONDARY_MIN_TOTAL}): ${short.length ? `${short.length} SHORT: ${short.map((r) => r.id).join(', ')}` : 'all met'}`);
if (strict && short.length) process.exit(1);
