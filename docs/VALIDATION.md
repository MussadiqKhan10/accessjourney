# v0.1 release validation

Validated on 31 October 2026 with Node.js 24.22.1, Chromium 153.0.8010.0, and axe-core 4.14.0. The environment could not retrieve the standard Playwright browser archive, so a Chromium executable from the published `@sparticuz/chromium` package was used through `ACCESSJOURNEY_CHROMIUM_PATH`. The project itself does not depend on that package.

## Passed locally

- Syntax checks for all four source modules
- 16 unit tests covering configuration, baseline behavior, URL filtering, environment references, HTML escaping, and report guidance
- 3 browser integration tests:
  - Two viewport sizes × four journey states; detects label and alternative-text defects only after the relevant interactions
  - Repeat run identifies existing findings; corrected fixture resolves the findings
  - Missing target produces an incomplete run with exit code 2
  - Report has no axe violations at 1280px and 390px widths, no horizontal overflow, and finding details open using the keyboard
- Runnable demo: eight checkpoints, six intentional issue occurrences, no run errors
- CLI help and version commands
- Package dry run; runtime files and license included
- Dependency audit: no reported vulnerabilities at validation time

The three browser test cases contain multiple assertions; the list above describes coverage, not a larger test count.

## Not established by these checks

- Human screen-reader testing or an independent accessibility audit
- Testing with disabled users; community evaluation is a next step
- Real mobile devices, Firefox, WebKit, or Windows/macOS
- Hosted CI results before publication; the workflow is supplied for Node 22 and 24
- Compatibility with every website or application

Automated results are evidence to help teams remove barriers, not proof of complete accessibility.
