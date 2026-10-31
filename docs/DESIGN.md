# Problem, design, and release boundary

## Problem hypothesis

A page's initial DOM does not contain every state a user will encounter. A dialog, expanded menu, or validation result may introduce accessibility barriers. Developers need repeatable evidence that identifies the interaction and viewport where a defect appears.

This hypothesis is grounded in existing accessibility evaluation guidance and browser automation capabilities, not interviews or a claimed market study. Sources:

- W3C WAI: https://www.w3.org/WAI/test-evaluate/
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- axe-core: https://github.com/dequelabs/axe-core

## Intended users and beneficiaries

Developers and QA teams run journeys; disabled users benefit when teams fix the barriers those journeys reveal. Accessibility practitioners and disabled contributors help identify what automated checks miss. We must evaluate the tool with those communities rather than treating automation as a substitute for their expertise.

## First release

Trusted JSON → validation → isolated context per viewport → action → axe analysis → optional focus trace → normalized findings → baseline comparison → HTML, JSON, Markdown.

The CLI owns browser lifecycle and closes contexts on errors. A failed action stops that viewport; the report marks the run incomplete. Findings use deterministic identities so repeat occurrences can be compared. Reports exclude raw node HTML and secret field values. Rendered HTML escapes user-controlled content and has a restrictive content security policy.

## Deliberate limits

- JSON authoring, not a visual recorder.
- Chromium viewport sizes, not real mobile hardware or multiple browser engines.
- A trace of keyboard focus, not automatic certification of correct focus order or trapping.
- axe rules tagged WCAG 2 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA, and best practices; not complete coverage of those standards.
- Selector-based regression identity can change when the DOM changes.
- No external dashboard, AI model, telemetry, account, or mandatory hosted service.

## Quality gates

Unit tests cover configuration, baseline behavior, privacy filtering, and report escaping. Real-browser integration tests prove that initially absent problems are detected after dialog and form interactions at two viewport sizes. Additional checks should cover keyboard-only use, screen readers, report zoom/reflow, and feedback from disabled people.

## Discovery

Use accurate phrases such as journey accessibility testing, Playwright accessibility regression testing, axe-core reports, and dialog/form accessibility. Explain the product with runnable examples. Publish original guides and respond to issues. Do not claim endorsements, user counts, rankings, or ChatGPT inclusion without evidence.
