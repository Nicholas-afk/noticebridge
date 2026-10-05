# Accessibility, mobile and export audit — 1.4.1

Checked 6 October 2026, Asia/Hong_Kong. Runtime reviewed at `4fb95c3d8309a4faa383901e15d0efa31924a522`. Model 1.1.0 and date/extraction logic are unchanged from 1.4.0. This is a development audit with fictional notices, not accessibility certification or a user study.

## Findings and fixes

The published 1.4.0 baseline erased review marks, reader-edited questions and saved reminders when the same notice was analysed again. Version 1.4.1 preserves them, including calendar identifiers, whenever source text and issue date exactly match the existing analysis. A successful analysis of changed source starts fresh. Changing either field first pauses the old snapshot: marking, confirmations, saving and all three exports are disabled. Exact reversion restores the existing work. Already downloaded files cannot be withdrawn from the reader's computer or calendar.

Other reproduced problems were a source visit returning to the wrong view, obsolete validation feedback after fixing source, an announcement still saying a reminder was saved after its date changed, and a confirmation's accessible name omitting its full visible wording. Fixes restore the originating view/control, clear resolved validation errors, announce withdrawal, and include the visible confirmation sentence plus the excerpt number. A model-load failure retains its recovery message while the reader types. Errors are associated with the affected fields; result headings have visible focus when analysis moves focus there.

Editable borders had only 1.43:1 contrast against paper. They now exceed 3:1. At phone widths buttons, disclosure summaries and checkbox labels have at least 44 CSS-pixel target height; reminder date inputs use 16-pixel text. Layouts allow wrapping. The existing source snapshot, exact offsets, warnings, conservative date defaults and reader-authoritative confirmations are preserved. Guidance explicitly says the tool does not resolve revised/conflicting notices.

Ten meaningful application workflow regressions use the real app, engine and follow-up modules in jsdom 29.0.0, stubbing model fetch and unavailable layout APIs. New failure cases were observed before fixes. The export test characterizes existing export behavior rather than demonstrating a new serializer change. These checks supplement the existing extraction, follow-up/calendar, 100 date and 8 model tests. All pass with Node 22.18.0. Final independent read-only review found no remaining Important implementation findings; it did not claim actual screen-reader or calendar-client validation.

## Actual browser coverage

Browser: Codex in-app browser on macOS. Measurements use DOM `innerWidth`, document width and scroll width, not the requested viewport alone. An inherited zoom setting on the 127.0.0.1 origin prevented valid early phone measurements; those were discarded. The same local server at localhost produced the requested CSS dimensions. The user's existing public tab was preserved.

| CSS viewport | Views inspected and audited | Horizontal overflow |
| --- | --- | --- |
| 320 × 740 | Checklist, Next steps, Source | None |
| 390 × 844 | Checklist, Next steps, Source | None |
| 768 × 1024 | Checklist, Next steps, Source | None |
| 1280 × 720 | Checklist, Next steps, Source | None |
| 1440 × 900 | Checklist, Next steps, Source | None |
| 640 × 450 | Library and unclear-deadline workflows | None |

The first five rows comprise a 15-view matrix. After subsequent runtime fixes, affected phone/desktop views, grouped dates, empty-notice validation and the explanation dialog were checked again. **25 persisted axe-core 4.11.1 runs reported zero violations and zero incomplete results**, with 40–41 applicable passed rules. Tags: WCAG 2 A/AA, 2.1 A/AA, 2.2 AA and best practice. The local diagnostics panel is excluded. Automated rules cannot establish full conformance, reading order comprehension, speech usability or all native control behavior. Raw results: [axe JSONL](verification/2026-10-06-accessibility-axe.jsonl).

Actual UI journeys covered:

- Typed source, all four fictional examples, issue-date entry, analysis, clearing, unchanged repeated analysis and changed-source updates.
- Keyboard Space/Enter for review marks and reminders; exact source highlighting from checklist/reminders; toolbar Source and Back returning to Next steps and the original button. Visible 2–3-pixel outlines were inspected. Skip to notice is the first keyboard link and activates the notice field.
- Editable questions, review progress and confirmed reminder preserved across views and repeated unchanged analysis. A revised notice and an issue-date-only edit pause old controls/exports. Successful update removes old reminders, confirmations, marks and draft. Empty-source update fails with “Paste a notice first”; old work stays paused, and exact source reversion clears the error and restores it. A single word is valid input, not a validation error.
- “9 & 12 October 2026”, “9 through 12 October 2026” and “9 and/or 12 October 2026”: blank reminder defaults, unchecked confirmations, distinct list/range/one-or-both clarification questions, invalid blank-date feedback, manually chosen date, explicit confirmation/save and withdrawal after date editing. Invalid dates, abbreviations and other date patterns remain covered by the unchanged 100-case regression suite.
- Unclear-deadline example: relative tomorrow, weekday/time and numeric date ambiguity remain unresolved without an issue date. Supplying 2026-10-06 suggests tomorrow as 2026-10-07, still unchecked. No date is automatically saved.
- Concatenated original/revised notices with 9 and 12 October: both quotations/date candidates remain separate and unconfirmed; the tool does not select a winning version. There is no automatic conflict detector. Reader/sender judgment remains necessary.
- Explanation dialog's initial close-button focus, reverse Tab remaining inside it, Tab returning to Close, Escape closing it and focus returning to About. Semantic tree exposes a named modal, one page H1, section H2s and group H3s, explicit field labels and unique excerpt names. Automated audits cover the dialog and errors too.
- All buttons and checkbox label targets measured at 320 CSS pixels had height ≥44 pixels. Individual native checkbox glyphs remain smaller inside those labels. Physical touch, virtual keyboards and OS date-picker usability were not tested.

[Journey JSONL](verification/2026-10-06-accessibility-journey.jsonl) contains 34 persisted observations, including source text, current reminders, controls, warnings, focus outlines and announcements. Earlier manual observations not saved before a browser-control reset are not counted in that file. It contains only fictional test text.

## Contrast and enlargement

Calculated sRGB contrasts for the authored palette:

| Foreground/background | Ratio |
| --- | ---: |
| Main ink #263c33 / canvas #f5f4ee | 10.73:1 |
| Muted text #59675f / paper #fffdf7 | 5.85:1 |
| Accent #2c5947 / paper | 7.86:1 |
| Warning #765014 / #f6efd9 | 6.24:1 |
| Editable border #7b887e / paper | 3.64:1 |
| Editable border / canvas | 3.36:1 |

The checks use [WCAG 2.2 contrast and focus requirements](https://www.w3.org/TR/WCAG22/), including 4.5:1 ordinary text and 3:1 relevant non-text boundaries. Disabled controls and native OS widget rendering are not a blanket contrast claim.

At 640 and 320 CSS pixels, layouts exercised widths corresponding to 1280 pixels at 200%/400% reflow; [W3C's reflow guidance](https://www.w3.org/WAI/WCAG21/Understanding/reflow) explains the 320-pixel condition. An additional **synthetic font-enlargement check** doubled computed text sizes in the local QA page at 390 × 844; the unclear-deadline reminder/question view remained readable without horizontal overflow. This does not reproduce every browser's text-only zoom behavior. Browser zoom shortcuts did not produce a verified zoom change, so **native browser zoom remains unverified**. Local QA code is never deployed.

VoiceOver Utility was available, but the native control connection failed while trying to reach accessibility settings; no running screen reader or spoken output was verified. **Actual screen-reader behavior is unverified.** Semantic tree, live regions, labels, keyboard focus and axe checks provide partial evidence only. Next independent check: VoiceOver/Safari and NVDA/Firefox with real readers.

## Downloads and compatibility

The actual phone UI downloaded `noticebridge-plan.txt`, `noticebridge-questions.txt` and `noticebridge-reminders.ics`; the browser added numbered suffixes for existing files. File names are fixed and do not expose notice content. The plan retained `[x]` review progress, reader-confirmed date, exact original notice and review warnings. Questions were byte-equal to the reader's edited draft. Calendar export is all-day, with no inferred time, time zone or alarm, even when source says 10 am. UTC DTSTAMP records export time, not event time.

Four actual downloaded calendar fixtures were parsed using **icalendar 6.3.2 / Python 3.14.3**, independently of the JavaScript serializer. Five event instances parsed with no errors: October 9 → exclusive October 10, repeated October export with the same UID, December 31 → January 1, leap-day February 29 2028 → March 1, and a download after the server stopped. Punctuation `, ; \\`, accented café, 香港確認書 and long UTF-8 quotations round-tripped exactly through DESCRIPTION. CRLF endings, byte-aware ≤75-byte folding, DATE values, unique event count, UTC DTSTAMP and absence of TZID/VALARM were checked. SUMMARY intentionally truncates long source at 80 Unicode code points; DESCRIPTION retains the full sentence. Invalid dates, unconfirmed entries, duplicate IDs and calendar injection guards remain covered by the original unit checks.

Fixtures are under [verification/accessibility-exports](verification/accessibility-exports); original downloaded file names/hashes are recorded in [download evidence](verification/2026-10-06-accessibility-downloads.json). Reproduce independent parsing with `python scripts/verify-export-fixtures.py` in an environment containing `icalendar==6.3.2`. [Parser evidence](verification/2026-10-06-accessibility-export-parser.json) includes fixture hashes. A fresh Git checkout initially normalized fixture CRLF endings and failed the byte check; `.gitattributes` now preserves their exact downloaded bytes, and the main checkout passes. Fixtures contain fictional data only. **Actual import into Apple/Google/Outlook calendars was not performed.** Parser compatibility cannot establish client-specific duplication, display, notifications or interoperability.

## Processing and privacy

Runtime code requests same-origin static assets and model.json. No notice POST, telemetry, persistent storage, cloud inference, clipboard upload or automatic calendar/message integration is present. Processing, edits and saved progress stay in tab memory; reload or Clear removes them. The host still receives ordinary asset requests, and browser/extensions are outside this application's guarantees. Downloaded files contain source text and can remain on disk or in an imported calendar.

After loading assets, the local server was stopped. A new typed notice was analysed, a reminder confirmed/saved and an actual calendar downloaded successfully, with no browser error logs. This verifies continued operation without the app server after loading; it does not verify offline startup. The app has no service-worker cache for offline startup. These conditions support the existing privacy claims without claiming protection from the hosting/browser environment.

## Remaining limits

Physical phones, actual screen-reader speech, native browser zoom, OS date-picker interaction and calendar-client imports remain unverified. No accessibility certification, usability improvement percentage or real-world ML accuracy is claimed. The model's documented weaknesses and synthetic-development limits remain in [MODEL_CARD.md](../MODEL_CARD.md). Independent annotated notices and consented reader/accessibility studies remain more valuable than additional cosmetic features.

## Published verification

GitHub Pages deployment `7b230ddb74f2a989df567ffa236d690f5190814c` is built with no error. The actual public page loaded matching app/style fingerprints 6e09e339b815 / 71e187d0d341 and no QA panel. Ten additional published observations at 320/390/1280 CSS pixels confirmed saved-work preservation, exact source navigation/return, stale guards, reset on new analysis, unresolved grouped dates and withdrawal announcements, with no horizontal overflow. See [live observations](verification/2026-10-06-accessibility-live.json). All three actual public downloads were checked on disk; the calendar independently parsed with correct source, October 9/10 all-day bounds and no alarm, while edited questions were exact and the plan retained its review mark/original notice. See [public download checks](verification/2026-10-06-accessibility-live-downloads.json). Final captures are `media/noticebridge-mobile-live-1.4.1.jpg` and `media/noticebridge-desktop-live-1.4.1.jpg`. Previous stable 1.4.0/source archive and deployment history are preserved.
