# AccessJourney

**Find accessibility barriers where they happen: across the user journey.**

AccessJourney helps teams find and fix accessibility barriers that affect disabled users. It runs repeatable browser journeys, checks the states reached after each interaction, and produces evidence developers can act on.

Opening a dialog, submitting a form, or moving through checkout can reveal problems that an initial-page scan never sees. AccessJourney brings those states into accessibility regression testing.

**v0.1.0 · MIT licensed · Runs locally · No account, API key, or paid service required**

## What you can do today

- Describe a journey using accessible roles, labels, test IDs, or CSS selectors.
- Check each named state with Playwright and axe-core, including dynamically revealed content.
- Run the same journey at desktop and mobile viewport sizes in separate browser contexts.
- Read an HTML report, inspect JSON results, or use a Markdown summary in a review.
- Compare a complete report with a baseline and fail CI on new serious or critical issue occurrences.
- Collect optional keyboard focus traces for human review.
- Enable optional screenshots with input, textarea, and editable content masking.

This release uses hand-authored JSON journeys. A visual recorder is planned, not included. Mobile testing currently means Chromium viewport testing, not real-device or screen-reader emulation.

## Try the working demo

Requirements: Node.js 22 or newer and a machine supported by Playwright Chromium.

```bash
git clone https://github.com/MussadiqKhan10/accessjourney.git
cd accessjourney
npm ci
npx playwright install chromium
npm run demo
```

On Linux, Playwright may require system dependencies: `npx playwright install --with-deps chromium`.

An existing compatible Chromium executable can be selected with `ACCESSJOURNEY_CHROMIUM_PATH=/absolute/path/to/chromium`. The standard Playwright-managed browser is recommended.

Open `artifacts/accessjourney/report.html`. The bundled local fixture is deliberately broken: the initial page is clean, opening its dialog reveals a missing input label, and submitting its form reveals an image missing alternative text. The report identifies the affected state at both viewport sizes. No data is submitted to an external service.

The demo exits successfully when those intentional defects are detected; the regular CLI fails when configured thresholds are reached. The package is **not yet published to npm**. Use the repository commands below.

## Test your application

Create `journey.json`:

```json
{
  "name": "Contact journey",
  "baseURL": "http://localhost:3000",
  "steps": [
    { "name": "Home", "action": "goto", "url": "/" },
    {
      "name": "Contact dialog",
      "action": "click",
      "target": { "role": "button", "name": "Contact us" }
    }
  ]
}
```

Start your application, then run:

```bash
node src/cli.js journey.json --output artifacts/contact
```

Every step scans unless `"scan": false` is set. Use a `waitFor` step for content that appears asynchronously; the runner does not guess when your application has finished updating. Locator names match exactly and must resolve unambiguously.

| Action | Required fields | Purpose |
| --- | --- | --- |
| `goto` | `url` | Navigate to an HTTP(S) page |
| `click` | `target` | Activate a control |
| `fill` | `target`, `value` | Fill a form field |
| `press` | `target`, `value` | Press a key, such as `Escape` |
| `check` | `target` | Check a checkbox |
| `select` | `target`, `value` | Select an option by value |
| `waitFor` | `target` | Wait for visible content |

Choose exactly one locator mode: `{"role":"button","name":"Continue"}`, `{"label":"Email"}`, `{"testId":"submit"}`, or `{"selector":"#submit"}`. Prefer roles and labels when possible. Fill values can reference environment variables, such as `"${TEST_EMAIL}"`; missing variables stop the run before browser interaction.

Optional configuration:

```json
{
  "viewports": [
    { "name": "desktop", "width": 1280, "height": 800 },
    { "name": "mobile", "width": 390, "height": 844 }
  ],
  "timeout": 10000,
  "failOn": ["serious", "critical"],
  "keyboard": { "tabs": 4 },
  "screenshots": false
}
```

`keyboard.tabs` defaults to zero. When enabled, the runner presses Tab after a scan, records element types and dialog containment, then restores the previously focused element. Focus/blur handlers may run. This is evidence for review; it does not automatically establish correct focus order, visible focus, or freedom from keyboard traps.

## Baseline accessibility regressions

```bash
node src/cli.js journey.json --baseline baseline/report.json --output artifacts/current
```

An occurrence is identified by viewport name, checkpoint name, rule, and target. Existing findings remain visible, while only new findings at configured impact levels fail the baseline gate. Resolved occurrences are counted after a complete run. A failed step is a run failure, never an accessibility pass.

Use the same checkpoint names, viewports, and viewport dimensions. Review changes before accepting a new baseline. Fingerprints are selector-based: DOM changes can make an existing issue appear new. Do not interpret baseline acceptance as fixing existing barriers.

| Exit | Meaning |
| --- | --- |
| `0` | Configured automated gate passed; manual review still needed |
| `1` | Qualifying new or unbaselined issues found |
| `2` | Invalid configuration, incompatible baseline, or incomplete run |

## Helping disabled users

Our purpose is to make everyday web tasks more usable for disabled people. Missing field labels can prevent screen-reader users from understanding a form. Dialog focus mistakes can interrupt keyboard navigation. Problems introduced only after an interaction can block someone from completing the task.

Automated testing is one part of that work. The report keeps human review tasks visible: keyboard operation, dialog focus, error announcements, zoom and reflow, and assistive-technology use. We welcome disabled contributors and accessibility practitioners to shape fixtures, priorities, and testing methods. We have **not yet conducted a user study or claimed independent accessibility certification**.

Read [W3C's evaluation guidance](https://www.w3.org/WAI/test-evaluate/) and [Playwright's accessibility testing guide](https://playwright.dev/docs/accessibility-testing). No automated tool alone establishes full WCAG conformance.

## Privacy and safe use

- Run only journeys and sites you are authorized to test. Actions can submit forms or change data. Prefer test environments and synthetic accounts.
- Reports are written to your chosen local directory. There is no AccessJourney telemetry or hosted collection service. The target website and browser still make their own network requests.
- Screenshots are off by default. Masking does not hide all sensitive content, such as names rendered in ordinary text, canvas content, or cross-origin frames.
- Reports omit node HTML, form values, URL query strings, fragments, and raw browser error messages. Names, selectors, URL paths, and screenshots can still contain sensitive information. Review before sharing.
- Reports and generated artifacts are ignored by Git by default. Do not publish authenticated reports as CI artifacts without review.
- Treat journey files as trusted automation. This is a local developer tool, not an internet-facing URL scanning service or a sandbox.

## Development and contributions

```bash
npm ci
npx playwright install chromium
npm run check
npm test
npm run test:integration
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [the design and problem statement](docs/DESIGN.md), [the roadmap](docs/ROADMAP.md), and [security reporting](SECURITY.md).

Useful contributions include reproducible accessibility fixtures, clearer remediation guidance, keyboard and screen-reader review methods, report accessibility improvements, documentation, and tests. No need to start with a large feature.

## Maintainer and license

Maintained by **Musaddiq Khan** ([@MussadiqKhan10](https://github.com/MussadiqKhan10)). Professional contact: [AwanioAI](https://awanioai.com).

[MIT](LICENSE). Built on [Playwright](https://github.com/microsoft/playwright) and [axe-core](https://github.com/dequelabs/axe-core); those projects retain their respective licenses and trademarks. AccessJourney is an independent project.
