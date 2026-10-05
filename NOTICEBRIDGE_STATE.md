# NoticeBridge state

Checked 6 October 2026, Asia/Hong_Kong. **Release 1.4.2 publication in progress.** Candidate verification is complete; public deployment verification and final release references will be recorded before completion. Model 1.1.0 and all completed date/accessibility fixes are preserved. Previous checkpoint: `docs/verification/NOTICEBRIDGE_STATE_1.4.1.md`.

## Scope and recovery

Recovered clean source/main/origin at `96047ae90140cad65bcd05bf4e844db4746317ac` and Pages `7b230ddb74f2a989df567ffa236d690f5190814c`, freshly confirmed built without error. Public visitor loaded the expected model and School trip workflow before changes. Existing tags v1.4.1/v1.4.0/v1.3.0 and deployment history remain. Before integration, a verified Git bundle and the 1.4.1 source ZIP were preserved outside the public repository. Preflight records their integrity.

The established isolated checkout was reused on `presentation-1.4.2`. No unrelated files were copied. `.openai/hosting.json` (obsolete private-host metadata) was removed from the current public tree and the whole directory ignored; existing relevant Git history was preserved. Only prepared `dist` is deployed; local axe tools/diagnostics are excluded.

## Implementation and artifacts

This bounded release clarifies the notice → exact instructions → source check → uncertainty review workflow, explicitly explains that Reviewed means wording checked rather than task done, and labels unchanged analysis **Review checklist**. The visual direction, model, engine, style and calendar serializer are unchanged.

README now leads with the fictional School trip notice and four exact instructions. ARCHITECTURE.md explains local data, source spans, conservative gates, reader authority and stale-state protection. EVALUATION.md records baseline/current conditions and unfavorable results. MODEL_CARD.md and SUBMISSION.md match current behavior. DEMO.md and media/README.md identify current captures and preserved historical diagrams/model results.

A **52-second silent captioned walkthrough** uses six actual 1.4.2 browser captures with fictional notices: original, four instructions, exact source highlight, confirmed reminder, blank alternative date and reader-edited questions. It is captured states, not continuous screen recording. No cursor, reply, calendar integration or performance claim is fabricated. H.264/yuv420p, 1920×1080, 30fps, no audio; pinned HyperFrames 0.8.134 composition/captures/OFL fonts are allowlisted under media/demo-source. Full check passed; sixteen inspected samples cover midpoints and both sides of every cut. Phone capture is an actual measured 390×844 view.

## Verification evidence

- Baseline and candidate full suites passed; final prepared tree rerun passed. Extraction/follow-up safeguards, 100 date cases, eight model tests and ten real-app workflow tests remain green. Node 22.18.0; build and whitespace checks pass. Calendar fixtures preserve intentional RFC 5545 CRLF/folding whitespace via Git attributes.
- Fresh `node audit.mjs` reproduced comparison artifacts without differences. Model 1.1.0: 329 authored synthetic training sentences; legacy 44/48→45/48, authored challenge 30/40→35/40, raw instruction recall 14/20→18/20, **precision worsened 14/15→18/21 (93.3%→85.7%)**. All three raw false positives remain Review. Five public instructions are convenience evidence only. No independent real-world accuracy/user benefit claim.
- Fresh affected-view matrix: **9 unique combinations**, measured CSS 320×740 / 390×844 / 1280×720 across Checklist, Next steps and Source. No horizontal overflow; axe-core 4.11.1 reported zero violations/incomplete results in all ten recorded runs (one repeated checklist check). `docs/verification/2026-10-06-publication-local.json`. Prior 1.4.1 evidence covers five widths and broader journeys, retained in its checkpoint and accessibility audit.
- Actual candidate plan, calendar and reader-edited question downloads passed disk checks. Calendar parsed independently with icalendar 6.3.2: exact consent source, 9 October 2026 all-day start, exclusive 10 October end, no TZID/time/alarm, CRLF and ≤75-byte lines. Reviewed state and full original notice remain in the plan; draft equals reader edits. `2026-10-06-publication-downloads.json` and publication-exports fixtures.
- Captures exercise source highlights, explicit confirmation/save, alternatives staying blank/unchecked and edited drafts/downloads. Same-source and stale-source behavior remains protected by unchanged passing workflow tests and will be rechecked on the public visitor.

Independent final read-only review found no remaining Critical or Important findings. Comparison-condition inaccuracies and the example-loading instruction were corrected before integration.

## Public links

- Source: https://github.com/Nicholas-afk/noticebridge
- Application: https://nicholas-afk.github.io/noticebridge/
- Demonstration: https://nicholas-afk.github.io/noticebridge/media/noticebridge-demo.mp4
- Entry: https://devpost.com/software/noticebridge

Current public commit/fingerprints and final visitor evidence: pending publication. Existing source/deployment checkpoints are retained.

Devpost freshly inspected: **Submitted, 4/4**, entry `1216996-noticebridge`, existing live/repository links. The previous story still described refreshed analysis as clearing state; the repository submission draft corrects it and adds the new demonstration link. Routine artifact updates can be saved without reaccepting the final agreement. No final submission/agreement will be repeated.

Earlier official cutoff is 10 October 2026 2:45 p.m. Hong Kong / 9 October 11:45 p.m. PDT; rules body conflicts with a later date. Rubric implementation 30%, innovation 20%, impact 20%, UX 15%, presentation 15%. Sources and prior check date are in docs/competition-assessment.md; not freshly researched in this presentation pass.

## Material limitations and next actions

Actual screen-reader speech, physical phones/touch/virtual keyboard, native browser zoom, OS date-picker interaction and calendar-client imports remain unverified. Semantic/keyboard/axe/parser evidence is partial, not certification. English lexical classification/date patterns can miss unfamiliar wording and cross-sentence dependencies. No automatic conflict resolution, OCR/translation or persistent history. One all-day reminder per excerpt, no time/alarm. Reload loses tab work; downloaded/imported files cannot be withdrawn.

The main weakness remains external validation: independently annotated de-identified notices, annotation disagreements, calibrated uncertainty and consented reader studies. The demonstration improves clarity of the existing evidence; it does not close that gap. Next release work should prioritize those evaluations and real assistive technology/device/client checks over extra features.
