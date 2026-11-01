// Drill and cheatsheet coverage per skill against the targets (Tier 1 >= 4 drills, others >= 3; every skill a cheatsheet entry).
//   npm run skills              # table (exit 0)
//   npm run skills -- --strict  # exit 1 if any skill is short
import { drillBank, skillCoverage } from '../src/content/drill-bank';

const strict = process.argv.includes('--strict');
const rows = skillCoverage();
console.log(`drill bank: ${drillBank.length} drills (${drillBank.filter((d) => d.source === 'skill').length} skill drills + ${drillBank.filter((d) => d.source === 'fluency').length} fluency drills)`);
console.log('skill'.padEnd(22), 'tier', 'drills', 'need', 'cheat', 'status');
for (const r of rows) console.log(r.id.padEnd(22), String(r.tier).padEnd(4), String(r.drills).padEnd(6), String(r.required).padEnd(4), (r.cheat ? 'yes' : 'no').padEnd(5), r.ok ? 'ok' : 'SHORT');
const short = rows.filter((r) => !r.ok);
console.log(`\n${rows.length} skills: ${short.length ? `${short.length} SHORT` : 'all covered'}`);
if (strict && short.length) process.exit(1);
