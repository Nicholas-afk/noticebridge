# NoticeBridge state

Checked 6 October 2026, Asia/Hong_Kong. **App 1.4.1 is verified locally; publication is pending.** Phone layouts, semantic accessibility, keyboard journeys and actual export checks are complete within the limits below. Model 1.1.0 and completed date fixes are preserved. Previous model/release detail: `docs/verification/NOTICEBRIDGE_STATE_1.4.0.md`.

## Recovery and release

- Primary repo: `/Users/nicholastanner/Documents/Codex/2026-10-05/ple/outputs/noticebridge`.
- Isolated checkout: `/Users/nicholastanner/Documents/Codex/2026-10-05/ple/work/noticebridge-accessibility`, branch `accessibility-1.4.1`. Native worktree creation cannot resolve the nested repo; the established Git fallback was reused. Keep it until all source/evidence is committed and the public release verified.
- Recovered clean main/origin at **72325ebc17c289790ca7bbde66b6e2487668c7f9**. Stable **v1.4.0**, **v1.3.0** and **v1.2.0** are preserved. No earlier work was discarded.
- Runtime implementation/final review: **4fb95c3d8309a4faa383901e15d0efa31924a522**, app **1.4.1**, model **1.1.0**. Resolve the containing Git revision for exact current documentation HEAD; the release tag will identify verified source.
- Source: https://github.com/Nicholas-afk/noticebridge ; demo: https://nicholas-afk.github.io/noticebridge/ ; entry: https://devpost.com/software/noticebridge . User's original browser tab was preserved; QA used separate tabs and fictional text.

## Implementation

- Exact same-source/issue-date analysis now preserves reviewed items, edited questions, confirmations, reminders and calendar identifiers. Successful changed-source analysis resets them.
- Source or issue-date edits explicitly pause the old snapshot and disable marking, confirmation, saving and all three exports. Exact source reversion restores work. Empty-source validation preserves paused work and clears when corrected. Previously downloaded/imported files cannot be withdrawn automatically.
- Source visits return to the originating view/button. Keyboard focus is visible. Errors are associated with inputs; model-load recovery feedback persists while typing. Date editing/unchecking withdraws saved reminders and announces withdrawal. Confirmation accessible names contain the entire visible wording plus excerpt number.
- Editable borders exceed 3:1 contrast. Phone button/disclosure/checkbox-label targets are ≥44 CSS pixels high; date text is 16 pixels and headings wrap. Model weights, extraction/date rules and calendar serializer are unchanged.
- Guidance says revised/conflicting notices need sender clarification. Both quotations remain separate; no automatic conflict detector or newest-date selection is claimed.

## Verification

- Full `npm test`, build and whitespace checks pass on Node **22.18.0**. Existing extraction/follow-up safeguards, **100 date regressions**, **8 model tests** and **10 new real-app workflow tests** pass. jsdom **29.0.0** tests use real runtime modules with fetch/layout stubs. Meaningful regressions failed before fixes; export characterization preserves existing serializer behavior.
- Actual browser matrix at measured CSS **320×740, 390×844, 768×1024, 1280×720 and 1440×900**, across Checklist/Next steps/Source: no horizontal overflow. Additional 640×450 reflow and synthetic doubled-font check at 390×844 passed. Native browser zoom itself remains unverified.
- **25 persisted axe-core 4.11.1 runs: zero violations, zero incomplete results**, including final affected views, dialog, empty validation and grouped dates. Partial automated evidence, not WCAG certification. `docs/verification/2026-10-06-accessibility-axe.jsonl`.
- **34 persisted browser journey observations** cover notice entry, examples, keyboard review/save, exact source/return, draft edits, unchanged analysis, revised source, issue-date edit, empty validation/reversion, distinct grouped dates, blank-date feedback, confirmation/withdrawal, conflicting notices, skip link and dialog Escape/focus return. `docs/verification/2026-10-06-accessibility-journey.jsonl`.
- Actual phone downloads retained review marks, original notice, warnings, confirmed dates and reader-edited questions. **Four calendar fixtures/five event instances** parsed independently using **icalendar 6.3.2 / Python 3.14.3**: stable repeated UID, all-day dates, exclusive next-day ends, year rollover, leap day, punctuation/Unicode escaping, CRLF and ≤75-byte folding; no TZID/alarm. Fixtures: `docs/verification/accessibility-exports`; reproduce with `scripts/verify-export-fixtures.py`.
- After stopping the local server, new analysis, confirmation and actual calendar download still worked. Runtime requests same-origin static/model assets, keeps progress in tab memory, and has no notice upload, cloud inference or persistent history. Offline startup is unsupported. Downloads can remain on disk/in calendars; host/browser behavior is outside app guarantees.
- Independent read-only review found no remaining Important implementation findings at **4fb95c3**, including the model-load guard and all ten workflow tests. No runtime review finding remains pending.
- Exact scenarios, contrast ratios, unfavorable findings and limitations: **`docs/accessibility-export-audit.md`**. Actual captures: `media/noticebridge-mobile-checklist.jpg`, `media/noticebridge-mobile-reminders.jpg`, `media/noticebridge-desktop-accessibility.jpg`.

## Deployment and Devpost

- Public demo currently remains verified **1.4.0**, Pages **109400ca179966fd62186276a23cc75e272f42cb**. Publish only built `dist`; local QA tools/fixtures are not runtime assets. Preserve Pages history and stable tags before updating.
- Previously verified Devpost: **Submitted, 4/4**, entrant `ncywtanner`, entry `1216996-noticebridge`. Existing model story/metrics and ten gallery images remain accurate. No Devpost edit or final agreement/submission was performed in this pass. This is prior verified status, not a fresh check.
- Earlier official cutoff: **10 October 2026, 2:45 p.m. Hong Kong / 9 October, 11:45 p.m. PDT**. Rules body gives a conflicting later cutoff. Rubric: implementation 30%, innovation 20%, impact 20%, UX 15%, presentation 15%. Edit submitted entry before the earlier deadline. Sources in `docs/competition-assessment.md`; not freshly researched in this accessibility pass.

## Remaining weaknesses and next actions

- Model 1.1.0: **329 authored synthetic training sentences**; unchanged conservative gates. Legacy categories 44/48→45/48, frozen authored challenge 30/40→35/40, raw action recall 14/20→18/20, but precision worsened 93.3%→85.7%. False raw positives remain Review. Five selected public instructions are convenience evidence only. Errors, overlap and reproducibility remain in `MODEL_CARD.md` and `docs/model-audit/`.
- **Actual screen-reader speech unverified**: VoiceOver Utility exists, but the native control connection failed while reaching accessibility settings; no active screen reader/output was verified. Semantic tree, labels, keyboard and axe are partial evidence only.
- **Physical phones/touch/virtual keyboard, native browser zoom, OS date-picker interaction and actual calendar-client imports remain unverified.** Parser compatibility does not prove client duplication/display/notification behavior. No accessibility certification or measured reader benefit exists.
- No automatic cross-notice conflict resolution, OCR or translation. English lexical model/date patterns can miss unfamiliar language. One reminder per excerpt; no inferred time/alarm. Progress is tab-only and lost on reload.
- Next: verify release publicly, then independent de-identified notices, consented reader tests including screen readers/physical devices, annotation disagreement/calibration and calendar-client import checks. No essential participation blocker prevents this release. Preserve stable versions, the user's browser tab and submitted entry.
