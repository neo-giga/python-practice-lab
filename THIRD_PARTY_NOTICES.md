# Third-party notices

The MIT [LICENSE](LICENSE) covers only this project's original code and content. The built site also ships, or is built with, the following software under its own license. Exact versions are pinned in `package-lock.json`.

## Shipped in the built site

| Component | Version | License | Notes |
| --- | --- | --- | --- |
| [Pyodide](https://github.com/pyodide/pyodide) | 314.0.7 | MPL-2.0 | Copied unmodified from the npm package into `dist/pyodide/` at build time. It bundles CPython 3.14 and its standard library, which are under the [PSF License Agreement](https://docs.python.org/3/license.html), plus components with their own licenses; see the upstream repository. |
| [CodeMirror 6](https://codemirror.net/) (`codemirror`, `@codemirror/*`) | 6.x | MIT | Editor. |
| [Lezer](https://lezer.codemirror.net/) (`@lezer/*`) | 1.x | MIT | Python grammar and highlighter. |
| [React](https://react.dev/), `react-dom`, `scheduler` | 19.3.1 / 0.28.0 | MIT | UI. |
| `crelt`, `style-mod`, `w3c-keyname`, `@marijn/find-cluster-break` | see lockfile | MIT | CodeMirror dependencies. |

## Build and test only (not shipped)

Vite, `@vitejs/plugin-react`, TypeScript, Vitest, vite-node, Playwright and their dependencies are used under their own licenses (MIT or Apache-2.0).

## Referenced, not included

The solution repositories that informed the curriculum are linked, not included. See [docs/REFERENCES.md](docs/REFERENCES.md).
