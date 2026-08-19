# Suppressed test warnings

`setup.cfg`'s `[tool:pytest]` `filterwarnings` uses `default` (show everything) plus explicit
`ignore` rules. This file documents *why* each ignore rule exists, so nobody re-adds one of
these warnings to CI without knowing it was a deliberate, informed choice.

All warnings listed below originate from third-party or edx-platform code loaded as part of the
LMS test app (`lms.envs.test`) — none of them are raised by code inside `iterativexblock/`. They
can't be fixed from this package: fixing them would mean patching `defusedxml`, `future`,
`PyContracts`/`numpy`, `newrelic`, `django-wiki`, or edx-platform itself, none of which this
package controls or pins in its own `setup.py`.

| Ignore rule (regex/category) | Source | Warning | Why it can't be fixed here |
|---|---|---|---|
| `defusedxml.cElementTree is deprecated.*` (`DeprecationWarning`) | `defusedxml/__init__.py` | `defusedxml.cElementTree` is deprecated, import from `defusedxml.ElementTree` instead | Third-party dependency (`defusedxml`), not imported by `iterativexblock` |
| `defusedxml.lxml is no longer supported.*` (`DeprecationWarning`) | `edx-platform/common/lib/safe_lxml/safe_lxml/etree.py` | `defusedxml.lxml` is no longer supported and will be removed in a future release | edx-platform's own module; not imported by `iterativexblock` |
| `the imp module is deprecated in favour of importlib.*` (`DeprecationWarning`) | `past/builtins/misc.py` (the `future` package, a transitive dep of the test image) | the `imp` module is deprecated in favour of `importlib` | Third-party dependency pinned by edx-platform's requirements, not by `iterativexblock` |
| `` `np\.(int\|float\|complex)` is a deprecated alias.* `` (`DeprecationWarning`) | `contracts/library/array_ops.py` (PyContracts, using old NumPy aliases) | `np.int`/`np.float`/`np.complex` are deprecated aliases for the builtin types | Third-party dependency (`PyContracts` + `numpy`), not imported by `iterativexblock` |
| `Using or importing the ABCs from 'collections'...` (`DeprecationWarning`) | `contracts/library/miscellaneous_aliases.py` (PyContracts) | ABCs moved from `collections` to `collections.abc` in Python 3.3+ | Third-party dependency (`PyContracts`), not imported by `iterativexblock` |
| `` `formatargspec` is deprecated since Python 3.5.* `` (`DeprecationWarning`) | `newrelic/console.py` | `inspect.formatargspec` is deprecated | Third-party APM agent installed in the LMS test image |
| `'etree' is deprecated. Use 'xml.etree.ElementTree' instead.*` (`DeprecationWarning`) | `lms/djangoapps/course_wiki/plugins/markdownedx/wiki_plugin.py` and `django-wiki`'s `wiki/plugins/links/wiki_plugin.py` | `markdown`'s `etree` alias is deprecated | edx-platform's wiki app and the third-party `django-wiki` package, not imported by `iterativexblock` |
| `No request passed to the backend, unable to rate-limit:UserWarning` | edx-platform auth backend | Rate-limiting is skipped because no request object was passed | Deliberate: test user logins aren't throttled on purpose |
| `xblock.exceptions.FieldDataDeprecationWarning` | XBlock runtime | Field data deprecation | Fixing requires a major, low-priority refactor of field data access across the block |

Note: unlike `ordertable`/`connectwithline`/`tablelonginput`/`iaa-xblock`, this package's test run
didn't surface the `sorl-thumbnail` (`RemovedInDjango30/31Warning`) or `enterprise` app
(`DeprecatedEdxPlatformImportWarning`) warnings, so no ignore rules were added for those here —
only add a rule for a warning you've actually seen in this package's own test output.


## If you see a new warning

Before adding another `ignore` rule here: check whether the warning traces back into
`iterativexblock/*.py` — if so, fix it (see the `web_fragments.fragment` example above) rather
than hiding it. Only add an ignore rule, and a row to this table, for warnings coming from code
outside this package.
