// Writer B: stack problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bStackProblems: CodingProblem[] = [
  {
    id: 'config-brackets-balance',
    version: 1,
    title: 'Do the brackets in this config line balance?',
    pattern: 'stack',
    subPatterns: ['matching'],
    difficulty: 'easy',
    priority: 1,
    estMinutes: 15,
    statement: [
      'A config linter checks one `line` of text at a time. The line may contain round `()`, square `[]` and curly `{}` brackets, mixed with any other characters (letters, digits, spaces, punctuation), which the linter ignores.',
      'Return `True` if every closing bracket matches the most recent unclosed opening bracket of the same kind and nothing is left open at the end; otherwise return `False`. A line with no brackets balances.',
    ].join('\n\n'),
    examples: [
      { input: '"map{key: [1, (2)]}"', output: 'True', explanation: 'The brackets read `{[()]}`: each closes the innermost one still open.' },
      { input: '"f(x]"', output: 'False', explanation: '`]` arrives while `(` is the innermost open bracket.' },
      { input: '"{(})"', output: 'False', explanation: 'The counts match, but `}` closes `{` while `(` is still open inside it.' },
    ],
    constraints: ['0 <= len(line) <= 10**5', 'line holds printable ASCII characters.'],
    signature: 'def brackets_balance(line: str) -> bool',
    starter: py`
      def brackets_balance(line: str) -> bool:
          return True
    `,
    solution: py`
      def brackets_balance(line: str) -> bool:
          opener = {")": "(", "]": "[", "}": "{"}
          stack = []
          for ch in line:
              if ch in "([{":
                  stack.append(ch)
              elif ch in opener:
                  if not stack or stack.pop() != opener[ch]:
                      return False
          return not stack
    `,
    complexity: { time: 'O(n)', space: 'O(n)', note: 'n = len(line); in the worst case every character is an opening bracket.' },
    explanation: [
      'The innermost open bracket is always the most recent one, which is exactly what a stack gives you: push openers, and on a closer pop the top and check it is the matching opener.',
      'Two ways to fail besides a mismatch: a closer with an empty stack (nothing to close), and openers left on the stack at the end. `return not stack` covers the second.',
    ].join('\n\n'),
    hints: [
      'When a closing bracket arrives, which opening bracket must it match?',
      'Push every opener on a list. On a closer, the top of the list must be its partner; pop it.',
      'Map each closer to its opener. For each char: opener → append; closer → if the stack is empty or `stack.pop() != opener[ch]`, return False. At the end return `not stack`.',
    ],
    idiomNote: 'A plain `list` is Python\'s stack: `append` and `pop` are O(1) at the end. `not stack` is `True` for an empty list, and `if not stack or stack.pop() != ...` relies on `or` short-circuiting so `pop` never runs on an empty list (it would raise `IndexError`). `ch in "([{"` tests one character against a string of candidates.',
    wrong: [
      // Counts each kind separately, so crossed brackets like "{(})" pass.
      py`
        def brackets_balance(line: str) -> bool:
            for o, c in ("()", "[]", "{}"):
                depth = 0
                for ch in line:
                    if ch == o:
                        depth += 1
                    elif ch == c:
                        depth -= 1
                        if depth < 0:
                            return False
                if depth != 0:
                    return False
            return True
      `,
      // Forgets to check that nothing is left open at the end.
      py`
        def brackets_balance(line: str) -> bool:
            opener = {")": "(", "]": "[", "}": "{"}
            stack = []
            for ch in line:
                if ch in "([{":
                    stack.append(ch)
                elif ch in opener:
                    if not stack or stack.pop() != opener[ch]:
                        return False
            return True
      `,
      // Pops without checking for an empty stack: a stray closer raises IndexError.
      py`
        def brackets_balance(line: str) -> bool:
            opener = {")": "(", "]": "[", "}": "{"}
            stack = []
            for ch in line:
                if ch in "([{":
                    stack.append(ch)
                elif ch in opener:
                    if stack.pop() != opener[ch]:
                        return False
            return not stack
      `,
    ],
    grading: { entry: 'brackets_balance', kind: 'function', compare: 'exact', lcMethod: 'bracketsBalance' },
    cases: [
      { args: '"map{key: [1, (2)]}"', expected: 'True' },
      { args: '"f(x]"', expected: 'False' },
      { args: '"{(})"', expected: 'False' },
      { args: '""', expected: 'True' },
      { args: '"no brackets here"', expected: 'True' },
      { args: '")("', expected: 'False' },
      { args: '"((("', expected: 'False' },
      { args: '"{[()()]}"', expected: 'True' },
      { args: '"a)"', expected: 'False' },
      { args: '"(" * 1500 + ")" * 1500', expected: 'True', label: '1 500 "(" then 1 500 ")"' },
      { args: '"[" * 1500 + ")" * 1500', expected: 'False', label: '1 500 "[" then 1 500 ")"' },
    ],
    similarTo: { lc: 20, url: 'https://leetcode.com/problems/valid-parentheses/' },
    recipeIds: ['stack-brackets', 'truthiness'],
    provenance: 'original',
  },
  {
    id: 'replay-keystrokes',
    version: 1,
    title: 'Replay a keystroke log',
    pattern: 'stack',
    subPatterns: ['undo'],
    difficulty: 'easy',
    priority: 2,
    estMinutes: 15,
    statement: [
      'A text box records every key press in `log`. Each character is typed as-is, except `<`, which is the backspace key: it deletes the character just before the cursor, or does nothing if the box is empty. The cursor is always at the end.',
      'Return the text left in the box after replaying the whole log.',
    ].join('\n\n'),
    examples: [
      { input: '"cat<<ow"', output: '"cow"', explanation: '`cat`, two backspaces leave `c`, then `ow` is typed.' },
      { input: '"<<hi"', output: '"hi"', explanation: 'Backspace on an empty box does nothing.' },
      { input: '"ab<<<"', output: '""', explanation: 'The third backspace finds the box already empty.' },
    ],
    constraints: ['0 <= len(log) <= 10**5', 'log holds printable ASCII characters; only "<" is special.'],
    signature: 'def replay(log: str) -> str',
    starter: py`
      def replay(log: str) -> str:
          return log.replace("<", "")
    `,
    solution: py`
      def replay(log: str) -> str:
          box = []
          for ch in log:
              if ch == "<":
                  if box:
                      box.pop()
              else:
                  box.append(ch)
          return "".join(box)
    `,
    complexity: { time: 'O(n)', space: 'O(n)', note: 'n = len(log).' },
    explanation: [
      'A backspace always removes the most recently typed surviving character, so the text box behaves like a stack of characters: typing pushes, backspace pops (when there is something to pop).',
      'Collect the characters in a list and join them once at the end.',
    ].join('\n\n'),
    hints: [
      'Which character does a backspace remove?',
      'Keep the typed characters in a list used as a stack; a backspace pops the last one if the list is not empty.',
      'For each char: if it is `<` and the list is non-empty, `pop()`; otherwise, if it is not `<`, `append`. Return `"".join(box)`.',
    ],
    idiomNote: 'Strings are immutable, so `text = text[:-1]` builds a new string on every backspace (O(n) each). A list with `append`/`pop` and one `"".join(...)` at the end is the idiomatic way to build text. Guard the `pop` with `if box:`; an empty list\'s `pop()` raises `IndexError`.',
    wrong: [
      // Pops without checking: a backspace on an empty box raises IndexError.
      py`
        def replay(log: str) -> str:
            box = []
            for ch in log:
                if ch == "<":
                    box.pop()
                else:
                    box.append(ch)
            return "".join(box)
      `,
      // Counts all backspaces and removes that many characters from the end, ignoring when they happened.
      py`
        def replay(log: str) -> str:
            typed = [ch for ch in log if ch != "<"]
            erased = log.count("<")
            return "".join(typed[:max(0, len(typed) - erased)])
      `,
    ],
    grading: { entry: 'replay', kind: 'function', compare: 'exact' },
    cases: [
      { args: '"cat<<ow"', expected: '"cow"' },
      { args: '"<<hi"', expected: '"hi"' },
      { args: '"ab<<<"', expected: '""' },
      { args: '""', expected: '""' },
      { args: '"a"', expected: '"a"' },
      { args: '"x<y<z"', expected: '"z"' },
      { args: '"no edits"', expected: '"no edits"' },
      { args: '"aa<a"', expected: '"aa"' },
      { args: '"ab" * 1500 + "<" * 2000', expected: '"ab" * 500', label: '"ab" typed 1 500 times, then 2 000 backspaces' },
    ],
    similarTo: { lc: 844, url: 'https://leetcode.com/problems/backspace-string-compare/' },
    recipeIds: ['string-building', 'list-basics'],
    provenance: 'original',
  },
];
