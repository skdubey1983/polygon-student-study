# Transition-inference deployment patch

This patch implements the final study chain:

Evidence marks -> distinct inferred transitions -> segment count.

## GitHub
Replace `index.html`, `style.css`, `app.js`, and `config.js`. Keep your current `tasks.js`.

## Apps Script
Replace `Code.gs`, then update the same Web App deployment using Deploy -> Manage deployments -> Edit -> New version -> Deploy. Keep the same /exec URL.

New responses are written to the `responses_transition` tab.

## Behavior
- Group A: visible polygon -> distinct transition marks -> segment estimate.
- Group B: separate L/G evidence marks -> common transition strip -> distinct transitions -> segment estimate.
- Group C: same chain independently at raw, first-change, and change-in-change stages.
- No manual revised question.
- L/G marks remain evidence marks and are never auto-merged.
