# NoticeBridge

Evidence-linked next steps for school and community notices.

NoticeBridge helps readers find what they need to do, when it is due and which details need clarification. Paste a notice, review its instructions in a numbered checklist, and select **Check source** to highlight the exact original sentence. The browser never sends pasted text to cloud AI.

## Try it

**[Open the public demo](https://nicholas-afk.github.io/noticebridge/)** · **[Devpost project](https://devpost.com/software/noticebridge)**

Choose **School trip** for a complete example. You can also serve the `dist` directory locally:

```sh
python3 -m http.server 48137 --bind 127.0.0.1 --directory dist
```

Visit `http://127.0.0.1:48137`. Choose **School trip** for the complete workflow or **Unclear deadline** for uncertainty handling. All examples are fictional. This is a static application, with no API key, account, backend or paid inference service.

## What it does

- Runs a trained TF–IDF + logistic regression classifier on each sentence in the browser.
- Groups instructions, event details, contacts and background text.
- Extracts dates, times and currency amounts without inventing missing information.
- Preserves negative instructions such as “Do not bring cash.”
- Highlights uncertain categories, missing years, ambiguous numeric dates, grouped dates, impossible full calendar dates and unsupported relative deadlines.
- Resolves only “today” and “tomorrow”, and only against an explicitly supplied notice issue date.
- Keeps every sentence accessible, including those assigned to background.
- Offers a checklist and local text-file export. It does not save a history.
- Adds a **Next steps** view for date-confirmed all-day reminders and an editable draft of questions for the sender.
- Suggests reminder dates only from a valid full date in that same sentence, or an explicitly anchored today/tomorrow reference. Grouped day and year lists or ranges stay quoted as one phrase, without choosing an endpoint. A grouping split across notice lines is flagged; dates on either side are not suggested automatically. Competing unresolved dates leave the field blank. The reader must confirm every date; editing a saved date withdraws its reminder.
- Exports saved reminders as a local `.ics` calendar file, with the exact sentence and review notes. It adds no inferred time or alarm and does not connect to a calendar account.
- Builds clarification questions from review notes, keeping each relevant sentence verbatim. The reader edits and downloads the draft; the app sends no messages.
- Shows review progress, with a direct return from a highlighted source sentence to its checklist item.
- Pauses marking and downloads when the notice or issue date changes, until the checklist is refreshed. Previous excerpts are explicitly identified as an older snapshot.
- Exposes optional WebMCP tools that use the same local action pipeline as the interface.

This is extractive information organization, not generative rewriting. Generic card headings are assigned by explicit rules; full instructions remain verbatim. Details from another sentence are not silently attached to an instruction.

## Model and reproducibility

The training corpus contains **245 authored synthetic English sentences**, including training-only template augmentation. The separate holdout contains **48 authored sentences** (12 per class). No real school notices, personal records or third-party training corpus are included.

| Metric | Result |
| --- | --- |
| Sentence category accuracy | 44/48 = 91.7% |
| Macro F1 | 0.917 |
| Instruction precision | 1.000 |
| Instruction recall | 10/12 = 83.3% |

These are results on a small synthetic benchmark, not estimates of accuracy on real notices. The holdout does not reuse exact training sentences or training augmentation templates, but comes from the same author and domain. Four errors and all scores are retained in `evaluation.json`. Scores are not calibrated reliability estimates.

Training uses unigrams and bigrams, sublinear term frequency, IDF weighting, L2 normalization, balanced class weights and logistic regression (`C=4.0`, seed 23). The trained vocabulary, IDF, coefficients and intercepts are exported to `dist/model.json`. `dist/engine.js` implements the same arithmetic without dependencies.

```sh
python3 -m pip install -r requirements.txt
python3 train.py
node prepare.mjs
npm test
```

`dataset.json` includes both splits and their provenance. `test.mjs` checks label and score parity between Python and JavaScript on every holdout sentence, source-span integrity, relative dates, numeric ambiguity, preserved negation, invalid dates and input limits. `followup.test.mjs` checks conservative suggestions, competing unresolved dates, leap-day and year rollover, calendar escaping and UTF-8 line folding, rejected unconfirmed/invalid exports and source-linked questions. `date.test.mjs` adds 44 adversarial cases for shared-month day lists and ranges, impossible named dates, abbreviated months, number-led sentence boundaries, multi-year dates, cross-line ambiguity and source preservation. Ambiguous number-led statements after month abbreviations cannot supply a missing year. Run all suites with `npm test`.

## Architecture

```text
Pasted notice (tab memory only)
  -> sentence spans (exact start/end positions)
  -> local TF–IDF features + logistic regression
  -> category uncertainty and instruction-cue review gate
  -> exact date/time/amount extraction + ambiguity checks
  -> evidence-linked action cards + complete original notice
  -> optional local checklist / text export
  -> reader-confirmed all-day calendar file / editable clarification draft
```

Only local assets are requested by the application. The hosting provider receives ordinary page requests; pasted notices are not included in them. The app does not cache itself for offline startup, but inference can continue without network access after its assets load. Exported plans contain the original notice, so readers should choose where to save them.

Calendar export uses [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html) date events, CRLF line endings, escaped text, UTF-8 byte-aware folding and an exclusive next-day end. Within one analysis, repeated exports retain event identifiers; some calendar clients may still duplicate imported files. NoticeBridge does not verify calendar-client import behavior. Reminder dates, confirmations and question drafts are discarded when the analysis is refreshed or cleared, and on page reload.

GitHub Pages under `Nicholas-afk` is the primary public host. Publish the built `dist` directory to the repository's `gh-pages` branch. The earlier private Sites copy is not the public demo.

Run `node prepare.mjs` after changing browser code, styles or the trained model and before publishing. It adds content fingerprints to asset URLs, including the engine and model dependencies, so a cached older script cannot be paired with a newer page. No build dependencies are required.

## Accessibility and design

The interface puts the source input beside a flat, numbered reading list. Instructions lead; uncertain categories and supporting dates or contacts form separate groups. A restrained green accent, paper-colored background, serif introduction and plain labels replace the original purple hero and nested card layout. Containers are limited to editable source text, its preserved snapshot, and meaningful notices. The direction is informed by [W3C cognitive accessibility guidance on clear step-by-step instructions](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/).

No accessibility certification or user study is claimed. Browser checks verified review progress, exact source highlighting, returning to the checklist, stale-plan protection, refreshed analysis and ambiguity prompts. Layouts were inspected at actual CSS widths of 960 and 1,280 pixels without horizontal overflow. Browser scaling prevented a reliable phone-width check, so phone layout and screen-reader QA remain unverified. The checklist baseline is in `media/noticebridge-live-demo.jpg`; the current date-checking example and reminder warnings are in `media/noticebridge-date-checks.jpg` and `media/noticebridge-date-reminders.jpg`. Completed browser downloads of the calendar, questions and plan files were verified on disk with the expected fictional source text. Calendar-client import behavior remains unverified.

Next-step browser checks also verified date suggestions with unchecked confirmations, saving a confirmed reminder, withdrawing it after a date edit, edited-draft preservation across views, stale input blocking follow-up controls, and Clear/refresh removing prior reminders and drafts. The unclear-deadline example supplies no suggested calendar dates. The **Dates to check** example keeps “9 or 12 October 2026” unresolved, flags “31 November 2026” as invalid, and preserves the abbreviated date “9 Oct. 2026”. The same review notes appear beside reminder selection and in the clarification draft. Browser checks verified blank grouped/invalid date fields, the valid abbreviated-date suggestion, visible warnings, saving after confirmation and withdrawal after editing the date, with no horizontal overflow on the published application at an actual 1,280-pixel CSS width.

## Limitations and next work

- English text only; no OCR, translation, document uploads or automatic web scraping.
- The small model can miss or misclassify unfamiliar wording.
- Sentence splitting is conservative and imperfect for unusual punctuation.
- Instructions that depend on another paragraph still require the reader to check the source.
- Dates are quoted; grouped day lists and ranges, weekday references, missing years and numeric date formats remain unresolved. Date extraction is a conservative English pattern matcher, not a general date parser. Month abbreviations followed by uncertain wording may be split conservatively, leaving a year unresolved.
- Intended for everyday notices, not legal, medical or emergency interpretation.
- No observed reduction in missed deadlines or reading effort is claimed.

Next steps are consented testing with readers and community staff, independently annotated real notices with identifying information removed, a larger held-out benchmark, confidence calibration, and accessibility testing on mobile devices and screen readers.

## Build disclosure

Created for the ML Empowerment Build Challenge 3.0 under the entrant's `ncywtanner` account.

MIT licensed. See `LICENSE`.
