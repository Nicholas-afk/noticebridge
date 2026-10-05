# NoticeBridge state

Checked 6 October 2026, Asia/Hong_Kong. This checkpoint preserves the previously completed project and finishes the date-review work.

## Repository and recovery

- Primary repository: `/Users/nicholastanner/Documents/Codex/2026-10-05/ple/outputs/noticebridge`.
- Public source: https://github.com/Nicholas-afk/noticebridge
- Demo: https://nicholas-afk.github.io/noticebridge/
- Recovered main and origin/main were clean at `57f68fc301bbcc589322b94b5fbe61cff76f50dd`, with no unpublished changes or pending live review. Both earlier reviewers had completed; their previous fixes were preserved.
- Prior verified release is preserved by the pushed annotated tag **v1.2.0** at `57f68fc`.
- Current runtime implementation commit: **`5c3e3eb2e46840346d7599286b08a2c3627ff077`**. Version **1.3.0** adds the reviewed date fixes. The published release/source commit is **`d15d926da45f4602a664ae1b522c046daaaa8488`**, preserved by the pushed annotated tag **v1.3.0**. Subsequent documentation commits add live proof; use the containing Git commit for the exact HEAD of this state checkpoint.
- Browser recovery preserved the user's public app tab and completed entry. Fictional QA used a separate local tab and isolated worktree.

## Implemented behavior

- `9 & 12 October` remains a list; `9 or 12 October` remains alternatives; `9 and/or 12 October` remains one-or-both wording; `9 through 12 October` remains a range. Slashes receive a question about their meaning. Mixed groups retain the relevant questions rather than being reduced to one endpoint.
- Grouped days, grouped years, joined full dates, shortened ISO endpoints (`2026-10-09–12`) and shortened named endpoints (`9 October 2026 through 12`) remain unresolved. Date controls start blank and confirmation remains unchecked.
- Named endpoint groups keep their own months: `28 February 2026 or 30–31 May 2026` does not invent February 30. Explicit invalid components are flagged; missing years are never supplied for reminders.
- Day-first and month-first grouped month abbreviations remain in one sentence. Number-led new statements cannot provide a missing year. A connector at the end of a line or beginning of the next blocks suggestions on both sides and preserves separate source spans.
- Noon, clock times, ordinary counts, formatted counts and decimals following a full date are not consumed as shortened days.
- The same review flags feed checklist warnings, reminder rows, question drafts, checklist export and calendar descriptions. Exact source quotations remain unchanged.
- Saving still requires a valid reader-chosen date and explicit confirmation. Editing the date withdraws the reminder and unchecks confirmation. Stale input blocks review marks and exports; refreshing or clearing removes previous reminders, review marks and edited drafts. View changes preserve them while the source is unchanged.
- No model retraining, new dependency, cloud inference, inferred event time, automatic calendar-account write, or saved notice history was introduced.

## Verification evidence

- Full `npm test` passed: 48 Python/JavaScript prediction and score comparisons, 8 source-span fixtures, input and negation checks, follow-up/calendar rejection and serialization checks, and **100 date regression tests**. New failure cases were observed before their fixes.
- `npm run build` and `git diff --check` passed. Asset fingerprints cover matching engine, model, follow-up and app dependencies.
- Independent read-only review ended **ready to merge at `5c3e3eb`**, with 37 additional production-code probes and no remaining actionable findings in the supported grammar. All substantive findings were fixed, including the regressions discovered during review.
- **24 actual-browser cases** checked rendered source equality, date values, unchecked confirmations, disabled save buttons, visible warnings and matching clarification questions locally and again on the published GitHub site. Evidence: `docs/verification/2026-10-06-date-browser.json` and `docs/verification/2026-10-06-live-browser.json`.
- Browser interaction verified manual date entry alone cannot save; confirmation enables saving; editing withdraws the saved reminder; review marks and edited questions persist across views; source highlighting is exact; stale inputs disable controls; refresh and Clear reset state.
- Actual downloaded checklist retained `[x]` review state, exact source, distinct warnings and its reader-confirmed reminder. Actual calendar download retained that source and warning, real CRLF bytes, an all-day start of 2026-10-09 and exclusive end of 2026-10-10. Calendar-client import behavior is not claimed.

## Deployment and Devpost

- Previous Pages deployment `4ada9ccdfc85c7cf10597961acb1927963ac642c` was verified built without error during recovery.
- **1.3.0 is published and verified live.** Pages deployment commit **`2f98b716de338a21b196f9473721ef673c704745`** has status **built**, with no reported error. All 24 live cases passed. Saving and date-edit withdrawal also passed on the published app; all three grouped phrases started blank and unchecked. Actual viewport was 1,280 × 720 CSS pixels, with no horizontal overflow.
- Public captures: `media/noticebridge-date-meaning.jpg` shows the source beside its list warning; `media/noticebridge-grouped-dates.jpg` shows the three distinct warnings. Both are actual browser captures of fictional notices. Previous captures remain preserved.
- Devpost entry: https://devpost.com/software/noticebridge
- Entry ID: `1216996-noticebridge`; entrant `ncywtanner` / Nicholas Tanner.
- The management page visibly confirmed **Submitted, 4/4 steps done**. The prior final submission and its checked, disabled agreement are preserved. Routine project-story updates remain available until the deadline.
- Story source: `SUBMISSION.md`. The routine story update was saved and publicly verified: it explains all date distinctions and **100 additional date cases**. A genuine live 1.3.0 screenshot and caption were added as the ninth gallery image; earlier media were preserved. The management page still reports **Submitted, 4/4 steps done**. No final submission or agreement was repeated.
- Local Devpost proof: `../noticebridge-1-3-submitted.jpg` and `../noticebridge-1-3-entry.jpg`. The source archive `../noticebridge-source.zip` is refreshed from tracked public files; private/internal directories are excluded.

## Remaining weaknesses and next actions

- No essential user-participation blocker is currently open.
- English pattern-based date extraction remains conservative and incomplete. Descending ranges and weekday/date consistency are not semantically checked. Unusual punctuation or paragraph dependencies can still require manual source review.
- One reminder is supported per excerpt; readers may need to choose an appropriate day for a multi-day instruction. The app never confirms that choice for them.
- Classification metrics remain a small authored synthetic benchmark: 44/48 categories (91.7%), 10/12 instruction recall (83.3%). No real-world accuracy, calibrated confidence, user study or deadline-reduction claim is made.
- Phone layout, screen-reader use and calendar-client imports remain unverified. Desktop browser behavior has been exercised at actual 1,280-pixel CSS width without horizontal overflow.
- Next useful work: consented reader/staff testing; independent annotation of de-identified real notices; a larger holdout and confidence calibration; mobile and screen-reader accessibility; calendar-client import checks; an authentic recorded demo.
- The requested review/release work is complete. No unpublished runtime changes or pending review remain. Future continuation should start by checking this state, Git HEAD/status, Pages status and the existing submitted Devpost entry. Preserve both release tags and the user’s browser tab. Do not reopen fixed review findings without a new reproduction.
