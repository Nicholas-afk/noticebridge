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
- Suggests reminder dates only from a valid full date in that same sentence, or an explicitly anchored today/tomorrow reference. Grouped day and year phrases stay unresolved, without choosing an endpoint. Warnings and questions distinguish lists (`9 & 12`), alternatives (`9 or 12`), one-or-both wording (`9 and/or 12`), ranges (`9 through 12`) and an unclear slash. Shortened ISO or named endpoints stay quoted as a whole; explicitly named endpoints retain their own months. Commas in choice lists do not turn choices into instructions to attend every date. A grouping split across notice lines is flagged whether its connector ends the first line or starts the next; dates on either side are not suggested automatically. Competing unresolved dates leave the field blank. The reader must confirm every date; editing a saved date withdraws its reminder.
- Exports saved reminders as a local `.ics` calendar file, with the exact sentence and review notes. It adds no inferred time or alarm and does not connect to a calendar account.
- Builds clarification questions from review notes, keeping each relevant sentence verbatim. The reader edits and downloads the draft; the app sends no messages.
- Shows review progress, with a direct return from a highlighted source sentence to its checklist item.
- Pauses marking and downloads when the notice or issue date changes, until the checklist is refreshed. Previous excerpts are explicitly identified as an older snapshot.
- Exposes optional WebMCP tools that use the same local action pipeline as the interface.

This is extractive information organization, not generative rewriting. Generic card headings are assigned by explicit rules; full instructions remain verbatim. Details from another sentence are not silently attached to an instruction.

## Model and reproducibility

Model **1.1.0** uses 329 authored synthetic training examples. It retains the four-class TF–IDF/logistic architecture and adds language diversity for passive requirements, conditions, operational notifications and historical distractors. The original model and all its artifacts are preserved in `docs/model-audit/baseline/`.

The original **44/48** result was reproduced byte for byte. No exact or normalized training/test overlap was found, but some examples are close paraphrases, and the same developer authored both splits. The 48 examples are now a legacy development check, not a fresh blind holdout. Current results are:

| Check | Original | Current |
| --- | ---: | ---: |
| Legacy categories | 44/48 | 45/48 |
| Frozen authored challenge categories | 30/40 | 35/40 |
| Authored raw instruction recall | 14/20 | 18/20 |
| Authored raw instruction precision | 93.3% | 85.7% |
| Authored instructions listed in Instructions | 2/20 | 10/20 |
| Authored inputs needing category review | 31/40 | 19/40 |
| Curated public instruction labels | 4/5 | 5/5 |

Precision became worse. All three current false raw instruction predictions remain Review under the unchanged score threshold; none is confidently listed as an instruction in these checks. The five public excerpts are a small, developer-selected convenience sample containing only instructions; they cannot measure precision or real-world accuracy. No user-benefit or representative accuracy claim follows from these numbers.

Read [MODEL_CARD.md](MODEL_CARD.md) for every error, baseline conditions, label policy, near-overlap, weaknesses and the release decision; [docs/competition-assessment.md](docs/competition-assessment.md) assesses the official rubric and existing tools. `audit-cases.json` was frozen before retraining; it remains development evidence because observed failure patterns informed training. `training-additions.json` preserves the supplement's provenance. Scores are uncalibrated. A heuristic vocabulary-coverage check now prompts review when most distinct words are unfamiliar, and own-property lookups prevent words such as `constructor` from corrupting scores.

```sh
python3 -m pip install -r requirements.txt
python3 train.py
npm run audit
npm run build
npm test
```

Training uses word unigrams/bigrams, sublinear TF, IDF, L2 normalization, balanced weights, logistic regression C=4.0 and seed 23. `audit-python.py` verifies both exported models against exact re-fitted scikit-learn parameters, saves hashes and overlap checks. `audit.mjs` saves all baseline/current predictions and workflow counts. Browser/Python labels and scores agree on all 93 evaluation inputs and eight additional accent/mixed-script boundary probes within 1e-10. Unicode-aware browser boundaries avoid treating accented names as unrelated ASCII prefixes. Existing span-integrity, input, negation, follow-up/calendar tests and 100 date regressions remain required. Eight model tests cover parity, varied instructions, uncertainty, historical wording and the inherited-property bug.

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

Next-step browser checks also verified date suggestions with unchecked confirmations, saving a confirmed reminder, withdrawing it after a date edit, edited-draft preservation across views, stale input blocking follow-up controls, and Clear/refresh removing prior reminders and drafts. The unclear-deadline example supplies no suggested calendar dates. The **Dates to check** example keeps “9 or 12 October 2026” unresolved, flags “31 November 2026” as invalid, and preserves the abbreviated date “9 Oct. 2026”. The same review notes appear beside reminder selection and in the clarification draft. The 1.3.0 public captures are in `media/noticebridge-date-meaning.jpg` and `media/noticebridge-grouped-dates.jpg`. Additional browser checks covered the three requested phrases with and without years, shortened ISO and named endpoints, grouped month abbreviations, separate endpoint months, noon after an ISO date, and a connector starting the next line. Grouped and invalid date fields stayed blank with confirmation unchecked. A downloaded reviewed checklist retained its review mark, exact phrases, distinct warnings and reader-confirmed reminder; its calendar download retained the source and warning with valid CRLF and all-day boundaries. Browser checks verified blank grouped/invalid date fields, the valid abbreviated-date suggestion, visible warnings, saving after confirmation and withdrawal after editing the date, with no horizontal overflow on the published application at an actual 1,280-pixel CSS width.

## Limitations and next work

- English text only; no OCR, translation, document uploads or automatic web scraping.
- The small model can miss or misclassify unfamiliar wording.
- Sentence splitting is conservative and imperfect for unusual punctuation.
- Instructions that depend on another paragraph still require the reader to check the source.
- Dates are quoted; grouped day lists and ranges, weekday references, missing years and numeric date formats remain unresolved. Date extraction is a conservative English pattern matcher, not a general date parser. Month abbreviations followed by uncertain wording may be split conservatively, leaving a year unresolved.
- Intended for everyday notices, not legal, medical or emergency interpretation.
- No observed reduction in missed deadlines or reading effort is claimed.

See [NOTICEBRIDGE_STATE.md](NOTICEBRIDGE_STATE.md) for the current release, deployment, review evidence and handoff state.

Next steps are consented testing with readers and community staff, independently annotated real notices with identifying information removed, a larger held-out benchmark, confidence calibration, and accessibility testing on mobile devices and screen readers.

## Build disclosure

Created for the ML Empowerment Build Challenge 3.0 under the entrant's `ncywtanner` account.

MIT licensed. See `LICENSE`.
