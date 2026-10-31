# Contributing to AccessJourney

Thank you for helping remove accessibility barriers. Code, accessibility expertise, lived experience, clear documentation, translations, and reproducible examples all matter here.

## Start small

Search existing issues, then describe the barrier, the expected behavior, and a minimal reproduction using synthetic content. For a large change, discuss the design in an issue before implementation. Do not submit private websites, user recordings, credentials, or personal information.

## Local setup

Use Node.js 22+, run `npm ci`, then `npx playwright install chromium`. Run `npm run check`, `npm test`, and `npm run test:integration` before submitting. Linux may require `npx playwright install --with-deps chromium`.

## Pull requests

Explain the user problem and resulting behavior. Include a test for a bug fix or a new behavior. Prefer clear code and small changes. Never describe a passing automated scan as proof that a website is accessible to everyone.

## Accessibility review

For report changes, test keyboard access, headings, contrast, zoom, and a narrow viewport. When providing screen-reader feedback, optionally include the browser and assistive technology used. Nobody needs to disclose a disability or medical history to contribute. We do not yet have a funded user-research program; participation is voluntary.

## Community conduct

Be respectful, discuss the work, and make room for different communication styles. Harassment, personal attacks, and publishing someone else's private information are not welcome. Maintainers may close or remove abusive contributions.

## Licensing

Submit only work you may share. Contributions are provided under the project's MIT license. Keep third-party attribution and license notices intact.
