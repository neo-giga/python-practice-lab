// Independent cross-check of drill expectations: the expected values written in
// the content are recomputed here with separate JavaScript implementations
// (brute force or closed form), not with the Python reference solutions.
import { describe, expect, it } from 'vitest';
import { codingProblems, exercises } from '../../src/content/index';

const ex = (id: string) => [...exercises, ...codingProblems].find((e) => e.id === id)!;
const expectedOf = (id: string, args: string) => ex(id).cases.find((c) => c.args === args)!.expected;

describe('independent cross-checks', () => {
  it('divide-toward-zero matches C/Java truncation (BigInt division truncates toward zero)', () => {
    const cases: [bigint, bigint, string][] = [
      [7n, 2n, '7, 2'],
      [-7n, 2n, '-7, 2'],
      [7n, -2n, '7, -2'],
      [-8n, -2n, '-8, -2'],
      [0n, 5n, '0, 5'],
    ];
    for (const [a, b, args] of cases) expect(BigInt(expectedOf('divide-toward-zero', args))).toBe(a / b);
    // big case: -(10**18 + 1) / 1
    expect(expectedOf('divide-toward-zero', '-(10**18 + 1), 1')).toBe('-(10**18 + 1)');
  });

  it('grid-paths-blocked: an open 10x10 grid has C(18, 9) paths', () => {
    let c = 1;
    for (let i = 1; i <= 9; i++) c = (c * (9 + i)) / i;
    expect(c).toBe(48620);
    expect(Number(expectedOf('grid-paths-blocked', '[[0] * 10 for _ in range(10)]'))).toBe(c);
  });

  it('count-step-ways(60, [1, 2]) is Fibonacci(61)', () => {
    let [a, b] = [0n, 1n];
    for (let i = 0; i < 61; i++) [a, b] = [b, a + b];
    expect(BigInt(expectedOf('count-step-ways', '60, [1, 2]'))).toBe(a);
    // and 7 with steps {1,3,5} by brute-force enumeration of compositions
    const count = (n: number): number => (n === 0 ? 1 : [1, 3, 5].filter((s) => s <= n).reduce((t, s) => t + count(n - s), 0));
    expect(Number(expectedOf('count-step-ways', '7, [1, 3, 5]'))).toBe(count(7));
  });

  it('lis-length agrees with brute force over all subsequences', () => {
    const brute = (a: number[]) => {
      let best = 0;
      for (let mask = 0; mask < 1 << a.length; mask++) {
        const pick = a.filter((_, i) => mask & (1 << i));
        if (pick.every((v, i) => i === 0 || pick[i - 1] < v)) best = Math.max(best, pick.length);
      }
      return best;
    };
    for (const c of ex('lis-length').cases) expect(Number(c.expected)).toBe(brute(JSON.parse(c.args)));
  });

  it('two-sum-indexes: every fixture has exactly one index pair, and it is the expected one', () => {
    for (const c of ex('two-sum-indexes').cases) {
      const [nums, target] = JSON.parse(`[${c.args}]`) as [number[], number];
      const pairs: [number, number][] = [];
      for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] + nums[j] === target) pairs.push([i, j]);
      expect(pairs, `${c.args} must have exactly one pair`).toHaveLength(1);
      expect(pairs[0], c.args).toEqual(JSON.parse(c.expected));
    }
  });

  it('largest-concat agrees with trying every permutation', () => {
    const perms = (xs: string[]): string[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));
    for (const c of ex('largest-concat').cases) {
      const nums = (JSON.parse(c.args) as number[]).map(String);
      const best = perms(nums)
        .map((p) => p.join(''))
        .reduce((m, s) => (BigInt(s) > BigInt(m) ? s : m));
      expect(JSON.parse(c.expected)).toBe(String(BigInt(best)));
    }
  });
});
