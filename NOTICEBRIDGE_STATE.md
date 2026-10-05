# NoticeBridge state

Checked 6 October 2026, Asia/Hong_Kong. **Release 1.4.0 is published and verified.** The model audit, review-driven fixes, competition-entry update and recovery documentation are complete. Completed date fixes are preserved.

## Recovery and releases

- Primary repo: `/Users/nicholastanner/Documents/Codex/2026-10-05/ple/outputs/noticebridge`.
- Implementation used isolated audit worktree: `/Users/nicholastanner/Documents/Codex/2026-10-05/ple/work/noticebridge-model-audit`, branch `model-audit-1.4`. Native worktree creation cannot resolve this nested repository; the previously established Git fallback was reused.
- Recovered clean main/origin: **b07d1d2bc6410934cff8a0caf9a295082b10a6ad**. No unpublished work or pending date-review finding was lost.
- Preserved stable **v1.3.0**: **d15d926da45f4602a664ae1b522c046daaaa8488**; prior v1.2.0 remains tagged. Historical state: `docs/verification/NOTICEBRIDGE_STATE_1.3.0.md`.
- Current runtime implementation: **99cdc62144656b57b026e19097b38eed2dcd4975**, app **1.4.0**, model **1.1.0**. Verified release/source commit **a6afcd217800dd255e4cf12b2959e25106d1c7be**, preserved as **v1.4.0**. Resolve the containing Git revision for the exact documentation HEAD.
- Audit cases and original artifacts frozen before retraining at **c9c99cf**. Baseline model/source/engine/data/evaluation are retained in `docs/model-audit/baseline/`.
- Source: https://github.com/Nicholas-afk/noticebridge ; demo: https://nicholas-afk.github.io/noticebridge/ ; entry: https://devpost.com/software/noticebridge . User's existing browser tab was preserved; QA used a separate local tab.

## Competition and improvement decision

- Official overview/structured schedule: **9 October 2026, 11:45 p.m. PDT / 10 October, 2:45 p.m. Hong Kong**. Rules body conflicts, giving **10 October, 9 p.m. PDT**. Operate against the earlier cutoff; discrepancy remains unresolved.
- Rubric: implementation 30%, innovation 20%, impact 20%, UX 15%, presentation 15%. Devpost permits submission edits until the deadline; subsequent portfolio edits do not update the submitted competition version. Precise official sources and competitor assessment: `docs/competition-assessment.md`.
- Task extraction/citations already exist in Gemini, Copilot and Goblin Tools. NoticeBridge's modest distinction is a local, account-free, exact-source notice workflow with conservative reminders. No commercial-tool superiority or novel ML architecture claim is made.
- Immediate consequential weakness: varied wording and excessive category-review workload. The chosen improvement diversifies the current classifier and its evaluation, avoiding new integrations. Independent real-notice/reader evidence remains the strongest unresolved weakness.

## Implementation and results

- Added 84 authored language-diversity training examples: passive requirements, conditional requests, operational notifications, exemptions, historical distractors. Total 329. Same TF–IDF/logistic architecture, balanced weights, C=4, seed 23.
- Retained .55 score/minimum-feature review gates. Added a heuristic unfamiliar-wording note below 50% distinct ASCII-word vocabulary coverage; it is not calibrated confidence. Independent review reproduced an accented-name boundary mismatch; browser Unicode-aware boundaries now match Python without retraining. Eight new accent/mixed-script probes pass. Fixed inherited-property lookups: `constructor` no longer corrupts scores.
- Original 245-example training reproduced model/data/evaluation **byte for byte**. No exact/normalized train/check overlap in either model; semantic/author/domain overlap remains. Original highest nearest-neighbour cosine .754. Full hashes, neighbours and re-fit checks: `docs/model-audit/python-audit.json`.
- Legacy categories **44/48→45/48**, raw action recall **10/12→11/12**. Two previously correct event/contact categories regress; both remain Review. The bookings requirement stays misclassified and remains Review.
- Frozen 40-input authored challenge: categories **30/40→35/40**, raw action recall **14/20→18/20**, Instructions listings **2/20→10/20**, category-review inputs **31/40→19/40**. Raw action precision worsens **93.3%→85.7%**; all 3 false raw action predictions remain Review, none confidently listed.
- Five developer-selected public instruction excerpts: raw action labels **4/5→5/5**, Instructions listings **2/5→3/5**. Instructions only, three organizations, tiny convenience sample; cannot establish precision/population accuracy/reader benefit.
- Binary anchored instruction rule detects 5/12 legacy, 2/20 authored, 2/5 public actions, with no sample false positives. No checked action was hidden in Background by either app pipeline.
- All checks remain development/convenience evidence; failure patterns informed new training. Every prediction/error/condition and unfavorable result: `docs/model-audit/comparison.json`, `MODEL_CARD.md`. The candidate is preferred for measured workflow improvement with conservative gating, not an unsupported real-world accuracy claim.

## Verification

- Full `npm test`, build and whitespace checks pass: original parity/span/input/negation checks, follow-up/calendar safeguards, 100 date regressions, 8 model tests including **93 Python/JavaScript labels/scores within 1e-10**.
- Both exported models exactly match re-fitted scikit-learn vocabulary/IDF/weights/intercepts, Python 3.14/scikit-learn 1.9.0. Meaningful regressions failed before their fixes. One initial confidence expectation was too strong; signed-consent wording remains explicitly tested as Review.
- **53 actual local-browser inputs** (45 classification inputs plus eight tokenizer-boundary probes) passed source/category checks: `docs/verification/2026-10-06-model-browser.json`.
- Actual workflow verified grouped dates blank/unchecked, distinct warnings/questions, date-only save rejection, confirmed save, exact source highlighting, edited draft/review marks preserved across views, date-edit withdrawal, stale-source blocking, refreshed-analysis reset and Clear reset.
- Actual downloaded checklist retains review mark, chosen date, exact source and unfamiliar-wording warning; downloaded questions equal the reader's edited draft. Evidence: `docs/verification/2026-10-06-model-workflow.json`.
- Extraction, conditions, negation, date distinctions and user confirmations are preserved. Independent read-only agent review is complete: ready to merge at 99cdc62144656b57b026e19097b38eed2dcd4975, no remaining actionable findings. Reviewer independently reproduced all artifacts and metrics, then resolved the P2 boundary issue and checked 90 additional inputs with maximum score difference 1.11e-16. **55 actual live-browser cases passed** (40 authored, five public, eight boundary probes and two bug/uncertainty guards); live grouped-date confirmation, draft/review persistence and date-edit withdrawal also passed. Evidence: `docs/verification/2026-10-06-model-live-browser.json`. Viewport 1280×720 CSS pixels, no horizontal overflow.

## Deployment and Devpost

- **Public 1.4.0 is deployed**, Pages **109400ca179966fd62186276a23cc75e272f42cb**, confirmed built with no error. The published app loads 329 training examples and the matching asset fingerprints. Prior 1.3.0 deployment 2f98b716de338a21b196f9473721ef673c704745 remains in Pages history.
- Management page freshly confirms **Submitted, 4/4**, entrant `ncywtanner`, entry `1216996-noticebridge`. Routine details editable; final submission/agreement is preserved and will not be repeated.
- The `SUBMISSION.md` story was saved and publicly verified with improved counts, worse precision, lost legacy categories and explicit development/convenience limits. All nine original gallery images remain; the original evaluation caption now clearly identifies model 1.0.0 as historical. A genuine live 1.4.0 image was added as the tenth image. Management still confirms Submitted, 4/4, checked/disabled agreement and disabled Project submitted button; no final agreement/submission was repeated. Proof: `../noticebridge-1-4-submitted.jpg`, `../noticebridge-1-4-entry.jpg`. Live capture: `media/noticebridge-language-review.jpg`.

## Remaining weaknesses and next actions

- No essential user-participation blocker prevents current work. Official deadline discrepancy and entrant eligibility are unverified; this audit makes no eligibility representation.
- Priority: independently annotated de-identified notices, consented reader tests, annotation disagreement, calibration, missed-action/review-burden measures. No user study, accessibility certification or measured deadline/reading-effort benefit exists.
- English lexical sentence model; no OCR/translation/document understanding. Vocabulary gate can overflag names and miss familiar-word ambiguity. Conservative English dates remain incomplete; one reminder per excerpt, no inferred time/alarm. Mobile, screen-reader and calendar-client import verification remain open.
- Requested work is complete; no pending review or unpublished runtime change remains. Recover from this checkpoint and Git status before future changes. Next work should prioritize independent labeled notices and consented reader testing, then mobile/screen-reader/calendar-client checks. Preserve v1.3.0 and v1.4.0, the user browser tab and the existing submitted entry. No automatic model-confidence or real-world accuracy claim is authorized by these results.
