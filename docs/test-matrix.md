# Risk-based test matrix

Each scenario runs under all three configured projects. Smoke tags cover login, catalog, cart totals and checkout.

| IDs | Risk | Observable oracle |
|---|---|---|
| AUTH-01–04 | Broken sign-in, lingering auth, anonymous writes | Visible state + HTTP 401 |
| CAT-01–04 | Missing items, unusable search, lexicographic price sorting | Exact names, counts and order |
| CAT-05 | Mobile horizontal overflow | Document width <= viewport |
| CART-01–03 | Wrong totals, lost state, stale items | Exact money, quantity after reload, disabled checkout |
| CART-04 | Quantity beyond supported boundary | HTTP 422 and unchanged state |
| CART-05 | Cross-session cart contamination | Second session has an empty cart |
| ORDER-01 | UI success without persisted order | UI confirmation + API item/total assertions |
| ORDER-02 | Invalid delivery data loses cart | Error and unchanged total |
| ORDER-03 | Client price tampering | Server-calculated total |
| RES-01–02 | Unrecoverable backend outage | Error, preserved state, successful retry |
| A11Y-01–02 | Detectable accessibility violations | axe WCAG A/AA rules |
| A11Y-03 | Mouse-only authentication | Focus and keyboard submission |

Not covered: payments, tax/shipping rules, inventory contention, browser-engine differences in WebKit, physical mobile devices, manual screen-reader audit, production security/performance.

No fixed sleeps, serial test dependencies, global cart reset, or broad catch-and-ignore assertions.
