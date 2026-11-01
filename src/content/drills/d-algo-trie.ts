// Writer D: trie template drills (algo-trie).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoTrieDrills: SkillDrill[] = [
  {
    id: 'trie-class-write',
    version: 1,
    title: 'Write a trie class',
    skills: ['algo-trie', 'dict-counter'],
    kind: 'write',
    prompt: 'Write `class Trie` with `insert(word)`, `search(word)` (was this exact word inserted?) and `starts_with(prefix)` (does any inserted word start with it?). Use nested dicts and an end-of-word marker.',
    signature: 'class Trie: insert(word: str) -> None; search(word: str) -> bool; starts_with(prefix: str) -> bool',
    starter: py`
      class Trie:
          def __init__(self):
              self.words = []

          def insert(self, word: str) -> None:
              self.words.append(word)

          def search(self, word: str) -> bool:
              return False

          def starts_with(self, prefix: str) -> bool:
              return False
    `,
    solution: py`
      class Trie:
          def __init__(self):
              self.root = {}

          def insert(self, word: str) -> None:
              node = self.root
              for ch in word:
                  node = node.setdefault(ch, {})
              node['$'] = True

          def _walk(self, s: str):
              node = self.root
              for ch in s:
                  if ch not in node:
                      return None
                  node = node[ch]
              return node

          def search(self, word: str) -> bool:
              node = self._walk(word)
              return node is not None and '$' in node

          def starts_with(self, prefix: str) -> bool:
              return self._walk(prefix) is not None
    `,
    why: 'Both queries walk the same path; only `search` also needs the end marker, because a path can exist as a prefix of a longer word without being a word itself.',
    hints: ['`insert`: `node = node.setdefault(ch, {})` for each character, then mark the end.', 'Share one `_walk(s)` helper that returns the node for `s` or `None`.'],
    wrong: [
      // No end marker: every prefix of an inserted word counts as a word.
      py`
        class Trie:
            def __init__(self):
                self.root = {}

            def insert(self, word: str) -> None:
                node = self.root
                for ch in word:
                    node = node.setdefault(ch, {})

            def _walk(self, s: str):
                node = self.root
                for ch in s:
                    if ch not in node:
                        return None
                    node = node[ch]
                return node

            def search(self, word: str) -> bool:
                return self._walk(word) is not None

            def starts_with(self, prefix: str) -> bool:
                return self._walk(prefix) is not None
      `,
      // starts_with demands a whole word.
      py`
        class Trie:
            def __init__(self):
                self.root = {}

            def insert(self, word: str) -> None:
                node = self.root
                for ch in word:
                    node = node.setdefault(ch, {})
                node['$'] = True

            def _walk(self, s: str):
                node = self.root
                for ch in s:
                    if ch not in node:
                        return None
                    node = node[ch]
                return node

            def search(self, word: str) -> bool:
                node = self._walk(word)
                return node is not None and '$' in node

            def starts_with(self, prefix: str) -> bool:
                return self.search(prefix)
      `,
    ],
    grading: { entry: 'Trie', kind: 'ops', compare: 'exact' },
    cases: [
      { args: "['Trie', 'insert', 'search', 'search', 'starts_with'], [[], ['cat'], ['cat'], ['ca'], ['ca']]", expected: '[None, None, True, False, True]' },
      { args: "['Trie', 'insert', 'search', 'starts_with', 'search'], [[], ['apple'], ['app'], ['app'], ['apple']]", expected: '[None, None, False, True, True]' },
      { args: "['Trie', 'insert', 'insert', 'search', 'search', 'starts_with'], [[], ['app'], ['apple'], ['app'], ['appl'], ['b']]", expected: '[None, None, None, True, False, False]' },
      { args: "['Trie', 'search', 'starts_with'], [[], ['x'], ['x']]", expected: '[None, False, False]' },
      { args: "['Trie', 'insert', 'insert', 'search'], [[], ['a'], ['a'], ['a']]", expected: '[None, None, None, True]' },
    ],
    provenance: 'original',
  },
  {
    id: 'trie-collect-past-marker-fix',
    version: 1,
    title: 'Fix the trie collector: words that continue past a word',
    skills: ['algo-trie', 'recursion-helpers'],
    kind: 'fix',
    prompt: '`words_with_prefix(words, prefix)` should list every word that starts with `prefix`, sorted. It stops at the first complete word, so `"apple"` is lost behind `"app"`. Fix `collect`.',
    signature: 'def words_with_prefix(words: list[str], prefix: str) -> list[str]',
    starter: py`
      def words_with_prefix(words: list[str], prefix: str) -> list[str]:
          root = {}
          for w in words:
              node = root
              for ch in w:
                  node = node.setdefault(ch, {})
              node['$'] = True
          node = root
          for ch in prefix:
              if ch not in node:
                  return []
              node = node[ch]
          out = []
          def collect(node, path):
              if '$' in node:
                  out.append(path)
                  return
              for ch in sorted(node):
                  collect(node[ch], path + ch)
          collect(node, prefix)
          return out
    `,
    solution: py`
      def words_with_prefix(words: list[str], prefix: str) -> list[str]:
          root = {}
          for w in words:
              node = root
              for ch in w:
                  node = node.setdefault(ch, {})
              node['$'] = True
          node = root
          for ch in prefix:
              if ch not in node:
                  return []
              node = node[ch]
          out = []
          def collect(node, path):
              if '$' in node:
                  out.append(path)
              for ch in sorted(node):
                  if ch != '$':
                      collect(node[ch], path + ch)
          collect(node, prefix)
          return out
    `,
    why: 'The end marker means "a word ends here", not "nothing follows": record the word and keep walking, skipping the marker key itself.',
    hints: ['Should finding `"app"` stop the search below it?', 'Remove the `return`, and skip the `\'$\'` key when looping over children.'],
    wrong: [
      // Drops the return but walks into the '$' marker (a bool), which crashes.
      py`
        def words_with_prefix(words: list[str], prefix: str) -> list[str]:
            root = {}
            for w in words:
                node = root
                for ch in w:
                    node = node.setdefault(ch, {})
                node['$'] = True
            node = root
            for ch in prefix:
                if ch not in node:
                    return []
                node = node[ch]
            out = []
            def collect(node, path):
                if '$' in node:
                    out.append(path)
                for ch in sorted(node):
                    collect(node[ch], path + ch)
            collect(node, prefix)
            return out
      `,
    ],
    grading: { entry: 'words_with_prefix', kind: 'function', compare: 'exact' },
    cases: [
      { args: "['app', 'apple', 'apt', 'bat'], 'ap'", expected: "['app', 'apple', 'apt']" },
      { args: "['car', 'cart', 'carts'], 'car'", expected: "['car', 'cart', 'carts']" },
      { args: "['be', 'bee', 'bed'], 'b'", expected: "['be', 'bed', 'bee']" },
      { args: "['dog'], 'cat'", expected: '[]' },
      { args: "['a'], ''", expected: "['a']" },
      { args: "[], 'a'", expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'trie-shortest-root',
    version: 1,
    title: 'Apply a trie: shorten words to their root',
    skills: ['algo-trie', 'strings'],
    kind: 'write',
    prompt: 'Replace each word of `sentence` (space-separated) by the shortest string in `roots` that it starts with; keep words with no matching root. Return the new sentence. Put the roots in a trie.',
    signature: 'def shorten(roots: list[str], sentence: str) -> str',
    starter: py`
      def shorten(roots: list[str], sentence: str) -> str:
          return sentence
    `,
    solution: py`
      def shorten(roots: list[str], sentence: str) -> str:
          trie = {}
          for r in roots:
              node = trie
              for ch in r:
                  node = node.setdefault(ch, {})
              node['$'] = True
          def root_of(word):
              node = trie
              for i, ch in enumerate(word):
                  if ch not in node:
                      return word
                  node = node[ch]
                  if '$' in node:
                      return word[:i + 1]
              return word
          return ' '.join(root_of(w) for w in sentence.split())
    `,
    why: 'Walking a word down the trie meets roots in increasing length, so the first end marker is the shortest root; the walk stops after at most `len(word)` steps.',
    hints: ['Insert every root with an end marker.', 'Walk each word; return the prefix at the first `\'$\'`, or the whole word if the path ends.'],
    wrong: [
      // Keeps walking and returns the longest matching root.
      py`
        def shorten(roots: list[str], sentence: str) -> str:
            trie = {}
            for r in roots:
                node = trie
                for ch in r:
                    node = node.setdefault(ch, {})
                node['$'] = True
            def root_of(word):
                node, best = trie, word
                for i, ch in enumerate(word):
                    if ch not in node:
                        break
                    node = node[ch]
                    if '$' in node:
                        best = word[:i + 1]
                return best
            return ' '.join(root_of(w) for w in sentence.split())
      `,
      // Takes the first root in list order, not the shortest.
      py`
        def shorten(roots: list[str], sentence: str) -> str:
            def root_of(word):
                for r in roots:
                    if word.startswith(r):
                        return r
                return word
            return ' '.join(root_of(w) for w in sentence.split())
      `,
    ],
    grading: { entry: 'shorten', kind: 'function', compare: 'exact' },
    cases: [
      { args: "['re', 'rep'], 'repeat the report'", expected: "'re the re'" },
      { args: "['rep', 're'], 'repeat'", expected: "'re'" },
      { args: "['sun', 'sunflower'], 'sunflowers are sunny'", expected: "'sun are sun'" },
      { args: "['abc'], 'ab abc abcd'", expected: "'ab abc abc'" },
      { args: "['a'], 'apple banana avocado'", expected: "'a banana a'" },
      { args: "[], 'a b'", expected: "'a b'" },
      { args: "['x'], ''", expected: "''" },
    ],
    provenance: 'original',
  },
];
