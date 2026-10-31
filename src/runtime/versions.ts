// Exact runtime versions shipped with this build. The pyodide version is read from the
// pinned npm package; the CPython version it embeds was observed at runtime
// (sys.version) and is re-verified by the corpus test.
import pyodidePkg from 'pyodide/package.json';

export const PYODIDE_VERSION: string = pyodidePkg.version;
export const EXPECTED_PYTHON_VERSION = '3.14.2';
export const RUNTIME_LABEL = `Pyodide ${PYODIDE_VERSION} (CPython ${EXPECTED_PYTHON_VERSION}, WebAssembly)`;
