# Five-minute review

1. Read one complete journey: [ORDER-01](../tests/specs/cart-checkout.spec.ts). Notice the API post-condition after UI checkout.
2. Follow [fixtures](../tests/fixtures.ts) to understand cookie sharing and test isolation.
3. Read [StorePage](../tests/pages/store.page.ts) and [CartComponent](../tests/pages/cart.component.ts) for composition.
4. Run `npm run test:smoke -- --project=chromium`.
5. Open `npm run test:report`. For a failure, inspect the trace's DOM snapshots, requests and console before changing locators.
6. Review the [tradeoffs](architecture.md) and uncovered risks.

## Interview prompts

- Why does API login not replace the UI login test?
- Which tests must reach the real service, and why are two responses intercepted?
- How does the suite stay independent with four workers?
- Why validate an order through another interface?
- What could axe miss, and what would you test manually?

## Honest resume wording

“Built an educational Playwright/TypeScript QA framework with isolated fixtures, Page/Component Objects, UI/API checkout verification, accessibility checks and GitHub Actions configuration.”

Only say CI passes after an actual successful GitHub run. Do not imply commercial usage, uptime, defect-reduction percentages or performance measurements that were not measured.
